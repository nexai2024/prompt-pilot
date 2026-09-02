'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Play, Save, Settings, Brain, Plus, Copy, Trash2, Edit, TestTube, Variable as Variables, History, Download, Upload, Sparkles, Code, Loader2, Star, Link2, Search, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';
import { VersionHistory } from '@/components/prompt-studio/VersionHistory';
import { PromptAssistPanel } from '@/components/prompt-studio/PromptAssistPanel';
import { PromptScorePanel } from '@/components/prompt-studio/PromptScorePanel';
import { parseFixtures, parseTags } from '@/lib/prompt-meta';
import { getLastPrompt, rememberPrompt } from '@/lib/recents';
import { estimatePromptTokens, formatRelativeTime } from '@/lib/relative-time';
import { readStore, writeStore } from '@/lib/local-store';

const FOCUS_MODE_KEY = 'pp-focus-mode';

interface Variable {
  id?: string;
  name: string;
  value?: string;
  type: string;
  description: string;
  default_value?: string;
  required: boolean;
}

interface Prompt {
  id: string;
  name: string;
  description: string;
  content: string;
  model: string;
  temperature: number;
  max_tokens: number;
  response_format: string;
  streaming: boolean;
  content_filtering: boolean;
  caching: boolean;
  status: string;
  tags?: string | string[] | null;
  is_starred?: boolean | number | null;
  test_fixtures?: string | null;
  created_at: string;
  updated_at: string;
}

type EditorSnapshot = {
  name: string;
  description: string;
  content: string;
  model: string;
  temperature: number;
  maxTokens: number;
  responseFormat: string;
  streaming: boolean;
  contentFiltering: boolean;
  caching: boolean;
  tags: string;
  starred: boolean;
  variables: Array<{
    name: string;
    value: string;
    type: string;
    description: string;
    required: boolean;
  }>;
};

function serializeEditor(snapshot: EditorSnapshot): string {
  return JSON.stringify(snapshot);
}

export default function PromptStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      }
    >
      <PromptStudio />
    </Suspense>
  );
}

function PromptStudio() {
  const searchParams = useSearchParams();
  const importInputRef = useRef<HTMLInputElement>(null);
  // Prompt state
  const [promptId, setPromptId] = useState<string | null>(null);
  const [promptName, setPromptName] = useState('');
  const [promptDescription, setPromptDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [variables, setVariables] = useState<Variable[]>([]);

  // Model settings
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(150);
  const [responseFormat, setResponseFormat] = useState('text');
  const [streaming, setStreaming] = useState(false);
  const [contentFiltering, setContentFiltering] = useState(true);
  const [caching, setCaching] = useState(true);

  // UI state
  const [testOutput, setTestOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [recentPrompts, setRecentPrompts] = useState<Prompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const [scoreEnhanceGoals, setScoreEnhanceGoals] = useState<string | null>(null);
  const [versionRefreshKey, setVersionRefreshKey] = useState(0);
  const [editingProd, setEditingProd] = useState(false);
  const [drifted, setDrifted] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [promptTags, setPromptTags] = useState('');
  const [sidebarFilter, setSidebarFilter] = useState<'all' | 'starred'>('all');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    serializeEditor({
      name: '',
      description: '',
      content: '',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 150,
      responseFormat: 'text',
      streaming: false,
      contentFiltering: true,
      caching: true,
      tags: '',
      starred: false,
      variables: [],
    })
  );
  const [focusMode, setFocusMode] = useState(false);
  const [focusHydrated, setFocusHydrated] = useState(false);
  const promptTextRef = useRef<HTMLTextAreaElement>(null);
  const skipResumeRef = useRef(false);
  const savePromptRef = useRef<() => Promise<void>>(async () => undefined);
  const testPromptRef = useRef<() => Promise<void>>(async () => undefined);
  const focusModeRef = useRef(false);

  // Load recent prompts
  useEffect(() => {
    loadRecentPrompts();
    setFocusMode(readStore(FOCUS_MODE_KEY, false));
    setFocusHydrated(true);
  }, []);

  useEffect(() => {
    focusModeRef.current = focusMode;
    document.documentElement.classList.toggle('pp-focus-mode', focusMode);
    if (focusHydrated) {
      writeStore(FOCUS_MODE_KEY, focusMode);
    }
    return () => {
      document.documentElement.classList.remove('pp-focus-mode');
    };
  }, [focusMode, focusHydrated]);

  const toggleFocusMode = (next?: boolean) => {
    setFocusMode((current) => {
      const value = next ?? !current;
      if (value) {
        toast.message('Focus mode', { description: 'Esc or ⌘. to show the full studio again.' });
        requestAnimationFrame(() => promptTextRef.current?.focus());
      }
      return value;
    });
  };

  const loadRecentPrompts = async () => {
    try {
      setLoadingPrompts(true);
      const response = await fetch(`/api/prompts`, { credentials: 'include' });
      const data = await response.json();

      if (response.ok) {
        setRecentPrompts(data.prompts || []);
      } else {
        toast.error(data.error || 'Failed to load prompts');
      }
    } catch (error: any) {
      toast.error('Failed to load prompts');
    } finally {
      setLoadingPrompts(false);
    }
  };

  const currentSnapshot = (): string =>
    serializeEditor({
      name: promptName,
      description: promptDescription,
      content: prompt,
      model: selectedModel,
      temperature,
      maxTokens,
      responseFormat,
      streaming,
      contentFiltering,
      caching,
      tags: promptTags,
      starred: isStarred,
      variables: variables.map((variable) => ({
        name: variable.name,
        value: variable.value || '',
        type: variable.type,
        description: variable.description,
        required: variable.required,
      })),
    });

  const isDirty = currentSnapshot() !== savedSnapshot;

  const confirmDiscard = () => {
    if (!isDirty) return true;
    return window.confirm('You have unsaved changes. Discard them?');
  };

  const suggestedTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of recentPrompts) {
      for (const tag of parseTags(item.tags)) {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
      .slice(0, 12);
  }, [recentPrompts]);

  const selectedTags = parseTags(promptTags);

  const filteredPrompts = useMemo(() => {
    const query = sidebarSearch.trim().toLowerCase();
    return recentPrompts.filter((item) => {
      if (sidebarFilter === 'starred' && item.is_starred !== true && item.is_starred !== 1) {
        return false;
      }
      if (!query) return true;
      const tags = parseTags(item.tags).join(' ');
      return `${item.name} ${item.description || ''} ${tags}`.toLowerCase().includes(query);
    });
  }, [recentPrompts, sidebarFilter, sidebarSearch]);

  const promptTokenEstimate = estimatePromptTokens(prompt);
  const tokenWarning = promptTokenEstimate > 3000;

  const addTag = (tag: string) => {
    if (selectedTags.includes(tag)) return;
    setPromptTags([...selectedTags, tag].join(', '));
  };

  const insertVariable = (name: string) => {
    const token = `{{${name}}}`;
    const field = promptTextRef.current;
    if (!field) {
      setPrompt((current) => `${current}${token}`);
      return;
    }
    const start = field.selectionStart ?? prompt.length;
    const end = field.selectionEnd ?? prompt.length;
    const next = `${prompt.slice(0, start)}${token}${prompt.slice(end)}`;
    setPrompt(next);
    requestAnimationFrame(() => {
      field.focus();
      const cursor = start + token.length;
      field.setSelectionRange(cursor, cursor);
    });
  };

  const copyStudioLink = async () => {
    if (!promptId) {
      toast.error('Save the prompt first to copy a shareable link');
      return;
    }
    const url = `${window.location.origin}/prompt-studio?promptId=${promptId}`;
    await navigator.clipboard.writeText(url);
    toast.success('Copied Studio link');
  };

  const addVariable = () => {
    setVariables([...variables, { name: '', value: '', type: 'string', description: '', required: false }]);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const updateVariable = (index: number, field: string, value: any) => {
    const updated = [...variables];
    updated[index] = { ...updated[index], [field]: value };
    setVariables(updated);
  };

  const extractVariablesFromPrompt = () => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = Array.from(prompt.matchAll(regex));
    const foundVars = new Set<string>();

    for (const match of matches) {
      foundVars.add(match[1]);
    }

    const newVariables: Variable[] = [];
    foundVars.forEach(varName => {
      const existing = variables.find(v => v.name === varName);
      if (existing) {
        newVariables.push(existing);
      } else {
        newVariables.push({
          name: varName,
          value: '',
          type: 'string',
          description: `Variable: ${varName}`,
          required: true
        });
      }
    });

    setVariables(newVariables);
    if (newVariables.length > foundVars.size - variables.length) {
      toast.success(`Found ${newVariables.length} variables in prompt`);
    }
  };

  const applyWorkingCopy = (version: {
    content: string;
    model: string;
    temperature: number;
    max_tokens: number;
    response_format?: string;
  }) => {
    setPrompt(version.content);
    setSelectedModel(version.model);
    setTemperature(version.temperature);
    setMaxTokens(version.max_tokens);
    if (version.response_format) setResponseFormat(version.response_format);
    if (!promptId) return;
    void (async () => {
      const response = await fetch(`/api/prompts/${promptId}/variables`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data.variables)) {
        setVariables(
          data.variables.map((item: {
            id?: string;
            name: string;
            type?: string;
            description?: string;
            default_value?: string;
            required?: boolean;
          }) => ({
            id: item.id,
            name: item.name,
            value: '',
            type: item.type || 'string',
            description: item.description || '',
            default_value: item.default_value,
            required: Boolean(item.required),
          }))
        );
      }
    })();
  };

  const loadPrompt = async (promptToLoad: Prompt) => {
    try {
      setIsLoading(true);
      setPromptId(promptToLoad.id);
      setPromptName(promptToLoad.name);
      setPromptDescription(promptToLoad.description || '');
      setPrompt(promptToLoad.content);
      setSelectedModel(promptToLoad.model);
      setTemperature(promptToLoad.temperature);
      setMaxTokens(promptToLoad.max_tokens);
      setResponseFormat(promptToLoad.response_format || 'text');
      setStreaming(promptToLoad.streaming || false);
      setContentFiltering(promptToLoad.content_filtering ?? true);
      setCaching(promptToLoad.caching ?? true);
      setIsStarred(promptToLoad.is_starred === true || promptToLoad.is_starred === 1);
      setPromptTags(parseTags(promptToLoad.tags).join(', '));
      const fixtures = parseFixtures(promptToLoad.test_fixtures);

      // Load variables
      const response = await fetch(`/api/prompts/${promptToLoad.id}/variables`, {
        credentials: 'include',
      });
      const data = await response.json();

      const nextVariables: Variable[] = response.ok
        ? data.variables.map((v: {
            id?: string;
            name: string;
            type?: string;
            description?: string;
            default_value?: string;
            required?: boolean;
          }) => ({
            id: v.id,
            name: v.name,
            value: fixtures[v.name] || '',
            type: v.type || 'string',
            description: v.description || '',
            default_value: v.default_value,
            required: Boolean(v.required)
          }))
        : [];
      setVariables(nextVariables);

      const tags = parseTags(promptToLoad.tags).join(', ');
      const starred = promptToLoad.is_starred === true || promptToLoad.is_starred === 1;
      setSavedSnapshot(
        serializeEditor({
          name: promptToLoad.name,
          description: promptToLoad.description || '',
          content: promptToLoad.content,
          model: promptToLoad.model,
          temperature: promptToLoad.temperature,
          maxTokens: promptToLoad.max_tokens,
          responseFormat: promptToLoad.response_format || 'text',
          streaming: promptToLoad.streaming || false,
          contentFiltering: promptToLoad.content_filtering ?? true,
          caching: promptToLoad.caching ?? true,
          tags,
          starred,
          variables: nextVariables.map((variable) => ({
            name: variable.name,
            value: variable.value || '',
            type: variable.type,
            description: variable.description,
            required: variable.required,
          })),
        })
      );
      rememberPrompt(promptToLoad.id, promptToLoad.name);

      toast.success('Prompt loaded successfully');
    } catch (error) {
      toast.error('Failed to load prompt');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const promptParam = searchParams.get('promptId') || searchParams.get('prompt');
    const resumeId = promptParam || (skipResumeRef.current ? null : getLastPrompt()?.id);
    if (!resumeId) return;

    void (async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/prompts/${resumeId}`, { credentials: 'include' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load prompt');
        await loadPrompt(data.prompt as Prompt);
        if (data.versioning?.drifted) setDrifted(true);
      } catch {
        if (promptParam) toast.error('Failed to load prompt from URL');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [searchParams]);

  const savePrompt = async () => {
    if (!promptName.trim()) {
      toast.error('Please enter a prompt name');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please enter prompt content');
      return;
    }

    try {
      setIsSaving(true);

      const promptData = {
        name: promptName,
        description: promptDescription,
        content: prompt,
        model: selectedModel,
        temperature,
        max_tokens: maxTokens,
        response_format: responseFormat,
        streaming,
        content_filtering: contentFiltering,
        caching,
        status: 'draft',
        variables,
        tags: promptTags,
        is_starred: isStarred,
      };

      let response;
      if (promptId) {
        response = await fetch(`/api/prompts/${promptId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promptData)
        });
      } else {
        response = await fetch('/api/prompts', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promptData)
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save prompt');
      }

      const savedPromptId = data.prompt.id;
      setPromptId(savedPromptId);
      setVersionRefreshKey((value) => value + 1);
      setSavedSnapshot(currentSnapshot());
      rememberPrompt(String(savedPromptId), promptName);

      if (data.versioning?.snapshotCreated) {
        toast.success('Saved. Created a new snapshot because the input/output structure changed.');
      } else {
        toast.success(promptId ? 'Working copy updated.' : 'Prompt created with Dev and Prod system versions.');
      }
      loadRecentPrompts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save prompt');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStar = async () => {
    if (!promptId) {
      setIsStarred((value) => !value);
      return;
    }
    const next = !isStarred;
    setIsStarred(next);
    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_starred: next }),
      });
      if (!response.ok) throw new Error('Could not update favorite');
      setRecentPrompts((current) =>
        current.map((item) =>
          item.id === promptId ? { ...item, is_starred: next } : item
        )
      );
    } catch {
      setIsStarred(!next);
      toast.error('Could not update favorite');
    }
  };

  const saveTestFixture = async () => {
    if (!promptId) {
      toast.error('Save the prompt first');
      return;
    }
    const fixtureValues = Object.fromEntries(
      variables
        .filter((variable) => variable.name.trim())
        .map((variable) => [variable.name, variable.value || ''])
    );
    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_fixtures: fixtureValues }),
      });
      if (!response.ok) throw new Error('Could not save fixture');
      toast.success('Saved test values for Playground and later runs');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save fixture');
    }
  };

  const testPrompt = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt to test');
      return;
    }

    try {
      setIsTesting(true);
      setTestOutput('');

      // Replace variables in prompt
      let processedPrompt = prompt;
      variables.forEach(variable => {
        if (variable.value) {
          processedPrompt = processedPrompt.replace(
            new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g'),
            variable.value
          );
        }
      });

      const response = await fetch('/api/llm/execute', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: processedPrompt,
          model: selectedModel,
          temperature,
          max_tokens: maxTokens,
          prompt_id: promptId || undefined,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute prompt');
      }

      const output = `✅ Test Execution Successful\n\n` +
                    `Response:\n${data.content}\n\n` +
                    `--- Metrics ---\n` +
                    `Model: ${data.model}\n` +
                    `Tokens Used: ${data.tokens_used}\n` +
                    `Cost: $${(data.cost_cents / 100).toFixed(4)}\n` +
                    `Latency: ${data.latency_ms}ms`;

      setTestOutput(output);
      toast.success('Prompt executed successfully!');
    } catch (error: any) {
      const errorOutput = `❌ Test Execution Failed\n\n` +
                         `Error: ${error.message}\n\n` +
                         `Please check your prompt and try again.`;
      setTestOutput(errorOutput);
      toast.error(error.message || 'Failed to execute prompt');
    } finally {
      setIsTesting(false);
    }
  };

  savePromptRef.current = savePrompt;
  testPromptRef.current = testPrompt;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        void savePromptRef.current();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        void testPromptRef.current();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === '.') {
        event.preventDefault();
        toggleFocusMode();
      }
      if (event.key === 'Escape' && focusModeRef.current) {
        event.preventDefault();
        toggleFocusMode(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const duplicatePrompt = () => {
    if (!prompt.trim() && !promptName.trim()) {
      toast.error('Nothing to duplicate');
      return;
    }
    skipResumeRef.current = true;
    setPromptId(null);
    setPromptName(promptName ? `${promptName} (copy)` : 'Untitled Prompt (copy)');
    setEditingProd(false);
    toast.success('Prompt duplicated — save to create a new copy');
  };

  const newPrompt = () => {
    if (!confirmDiscard()) return;
    skipResumeRef.current = true;
    setPromptId(null);
    setPromptName('');
    setPromptDescription('');
    setPrompt('');
    setVariables([]);
    setTestOutput('');
    setSelectedModel('gpt-4');
    setTemperature(0.7);
    setMaxTokens(150);
    setResponseFormat('text');
    setEditingProd(false);
    setDrifted(false);
    setIsStarred(false);
    setPromptTags('');
    setSavedSnapshot(
      serializeEditor({
        name: '',
        description: '',
        content: '',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 150,
        responseFormat: 'text',
        streaming: false,
        contentFiltering: true,
        caching: true,
        tags: '',
        starred: false,
        variables: [],
      })
    );
    toast.success('New prompt created');
  };

  const exportPrompt = () => {
    if (!prompt.trim() && !promptName.trim()) {
      toast.error('Nothing to export');
      return;
    }

    const bundle = {
      version: 1,
      exported_at: new Date().toISOString(),
      name: promptName,
      description: promptDescription,
      content: prompt,
      model: selectedModel,
      temperature,
      max_tokens: maxTokens,
      response_format: responseFormat,
      streaming,
      content_filtering: contentFiltering,
      caching,
      variables,
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${promptName.trim() || 'prompt'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Prompt exported');
  };

  const importPromptFile = async (file: File) => {
    if (!confirmDiscard()) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as Record<string, unknown>;

      setPromptId(null);
      setPromptName(String(data.name || 'Imported Prompt'));
      setPromptDescription(String(data.description || ''));
      setPrompt(String(data.content || ''));
      setSelectedModel(String(data.model || 'gpt-4'));
      setTemperature(Number(data.temperature ?? 0.7));
      setMaxTokens(Number(data.max_tokens ?? 150));
      setResponseFormat(String(data.response_format || 'text'));
      setStreaming(Boolean(data.streaming));
      setContentFiltering(data.content_filtering !== false);
      setCaching(data.caching !== false);

      if (Array.isArray(data.variables)) {
        setVariables(
          data.variables.map((v: Record<string, unknown>) => ({
            name: String(v.name || ''),
            value: String(v.value || ''),
            type: String(v.type || 'string'),
            description: String(v.description || ''),
            default_value: v.default_value ? String(v.default_value) : undefined,
            required: v.required !== false,
          }))
        );
      }

      toast.success('Prompt imported — save to persist');
    } catch {
      toast.error('Invalid prompt JSON file');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/80 backdrop-blur">
        <div className={`${focusMode ? 'max-w-5xl' : 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-8`}>
          <div className="flex items-center justify-between h-16 gap-3">
            <div className="flex min-w-0 items-center space-x-4">
              {!focusMode ? (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Dashboard
                    </Link>
                  </Button>
                  <div className="h-6 w-px bg-gray-300" />
                </>
              ) : null}
              <div className="flex min-w-0 items-center space-x-2">
                <div className="w-8 h-8 shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                {focusMode ? (
                  <Input
                    value={promptName}
                    onChange={(event) => setPromptName(event.target.value)}
                    placeholder="Untitled prompt"
                    className="h-8 max-w-xs border-transparent bg-transparent px-1 text-base font-semibold shadow-none focus-visible:border-input focus-visible:bg-background"
                  />
                ) : (
                  <h1 className="text-xl font-semibold">Prompt Studio</h1>
                )}
                {!focusMode ? (
                  <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI-Powered
                  </Badge>
                ) : null}
                {promptId && (
                  <Badge variant={editingProd ? 'destructive' : 'secondary'}>
                    {editingProd ? 'Editing production' : 'Dev'}
                  </Badge>
                )}
                {isDirty ? (
                  <Badge variant="outline" className="border-amber-300 text-amber-700">
                    Unsaved
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center space-x-3">
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importPromptFile(file);
                  event.target.value = '';
                }}
              />
              {!focusMode ? (
                <>
                  <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
                    <Link href="/templates">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Templates
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="hidden sm:flex" onClick={exportPrompt}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex"
                    onClick={() => importInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                  <Button variant="outline" size="sm" className="hidden sm:flex" onClick={duplicatePrompt}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </Button>
                  {promptId && (
                    <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
                      <Link href={`/api-designer?promptId=${promptId}`}>
                        <Code className="w-4 h-4 mr-2" />
                        Design API
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex"
                    onClick={() => void copyStudioLink()}
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    Copy link
                  </Button>
                  <Button variant="outline" size="sm" className="hidden sm:flex" onClick={newPrompt}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Prompt
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="hidden sm:flex"
                    onClick={() => void toggleStar()}
                  >
                    <Star className={`w-4 h-4 mr-2 ${isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
                    {isStarred ? 'Favorited' : 'Favorite'}
                  </Button>
                </>
              ) : null}
              <Button
                variant={focusMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleFocusMode()}
              >
                {focusMode ? (
                  <Minimize2 className="w-4 h-4 mr-2" />
                ) : (
                  <Maximize2 className="w-4 h-4 mr-2" />
                )}
                {focusMode ? 'Exit focus' : 'Focus'}
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={savePrompt}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <span className="hidden text-[10px] text-muted-foreground lg:inline">⌘S</span>
            </div>
          </div>
        </div>
      </div>

      {editingProd && (
        <div className="border-b bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          <div className={`${focusMode ? 'max-w-5xl' : 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-8 py-2 text-sm`}>
            You are editing production. The previous working copy is parked on the Shelf.
            Publishing restores the shelf automatically. Cancel from Version History to abort.
          </div>
        </div>
      )}
      {drifted && !editingProd && (
        <div className="border-b bg-sky-50 text-sky-950 dark:bg-sky-950/40 dark:text-sky-100">
          <div className={`${focusMode ? 'max-w-5xl' : 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-8 py-2 text-sm`}>
            Dev is ahead of Prod. Publish from Version History when this working copy should go live.
          </div>
        </div>
      )}

      <div className={`${focusMode ? 'max-w-5xl' : 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-8 ${focusMode ? 'py-5' : 'py-8'}`}>
        <div className={focusMode ? '' : 'grid grid-cols-1 lg:grid-cols-4 gap-8'}>
          {/* Sidebar */}
          {!focusMode ? (
          <div className="lg:col-span-1 space-y-6">
            {/* Recent Prompts */}
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center">
                    <History className="w-5 h-5 mr-2 text-blue-600" />
                    Prompts
                  </span>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setSidebarFilter((value) => (value === 'all' ? 'starred' : 'all'))
                    }
                  >
                    {sidebarFilter === 'starred' ? 'Show all' : 'Favorites'}
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={sidebarSearch}
                    onChange={(event) => setSidebarSearch(event.target.value)}
                    placeholder="Search name or tag"
                    className="h-9 pl-8 text-sm"
                  />
                </div>
                {suggestedTags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedTags.slice(0, 6).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground hover:border-primary hover:text-foreground"
                        onClick={() =>
                          setSidebarSearch((current) => (current === tag ? '' : tag))
                        }
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                ) : null}
                {loadingPrompts ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  </div>
                ) : filteredPrompts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {recentPrompts.length === 0
                      ? 'No prompts yet. Create your first one!'
                      : 'No prompts match that search.'}
                  </p>
                ) : (
                  filteredPrompts.slice(0, sidebarSearch ? 20 : 8).map((recentPrompt) => (
                    <div
                      key={recentPrompt.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      onClick={() => {
                        if (recentPrompt.id === promptId) return;
                        if (!confirmDiscard()) return;
                        void loadPrompt(recentPrompt);
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {recentPrompt.is_starred === true || recentPrompt.is_starred === 1
                            ? '★ '
                            : ''}
                          {recentPrompt.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(recentPrompt.updated_at)}
                        </p>
                        {parseTags(recentPrompt.tags).length > 0 ? (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {parseTags(recentPrompt.tags).slice(0, 3).map((tag) => (
                              <span key={tag} className="text-[10px] text-muted-foreground">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <Badge variant={recentPrompt.status === 'deployed' ? 'default' : 'outline'} className="ml-2">
                        {recentPrompt.status}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
          ) : null}

          {/* Main Content */}
          <div className={focusMode ? '' : 'lg:col-span-3'}>
            <Tabs defaultValue="editor" className="space-y-6">
              <TabsList className={`grid w-full bg-gray-100 p-1 rounded-xl ${focusMode ? 'grid-cols-2' : 'grid-cols-5'}`}>
                <TabsTrigger value="editor" className="rounded-lg">Prompt Editor</TabsTrigger>
                {!focusMode ? <TabsTrigger value="score" className="rounded-lg">AI Score</TabsTrigger> : null}
                <TabsTrigger value="test" className="rounded-lg">Test & Debug</TabsTrigger>
                {!focusMode ? <TabsTrigger value="settings" className="rounded-lg">Model Settings</TabsTrigger> : null}
                {!focusMode ? <TabsTrigger value="history" className="rounded-lg">Version History</TabsTrigger> : null}
              </TabsList>

              <TabsContent value="editor" className="space-y-6">
                {/* Prompt Editor */}
                <Card className="shadow-xl border-0 bg-white">
                  {!focusMode ? (
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="flex items-center">
                      <Edit className="w-5 h-5 mr-2 text-green-600" />
                      Prompt Editor
                    </CardTitle>
                    <CardDescription>
                      Create your AI prompt. Use {'{{variable_name}}'} syntax for dynamic variables.
                    </CardDescription>
                  </CardHeader>
                  ) : null}
                  <CardContent className="p-6 space-y-6">
                    {!focusMode ? (
                    <div>
                      <Label htmlFor="prompt-name" className="text-sm font-medium">Prompt Name *</Label>
                      <Input
                        id="prompt-name"
                        placeholder="Enter a descriptive name for your prompt"
                        className="mt-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                        value={promptName}
                        onChange={(e) => setPromptName(e.target.value)}
                      />
                    </div>
                    ) : null}
                    {!focusMode ? (
                    <div>
                      <Label htmlFor="prompt-description" className="text-sm font-medium">Description</Label>
                      <Input
                        id="prompt-description"
                        placeholder="Brief description of what this prompt does"
                        className="mt-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                        value={promptDescription}
                        onChange={(e) => setPromptDescription(e.target.value)}
                      />
                    </div>
                    ) : null}
                    {!focusMode ? (
                    <>
                    <div>
                      <Label htmlFor="prompt-tags" className="text-sm font-medium">Tags</Label>
                      <Input
                        id="prompt-tags"
                        placeholder="support, refunds, production"
                        className="mt-2 border-gray-200"
                        value={promptTags}
                        onChange={(e) => setPromptTags(e.target.value)}
                      />
                      {suggestedTags.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {suggestedTags.map((tag) => {
                            const active = selectedTags.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                className={`rounded-full border px-2 py-0.5 text-[11px] ${
                                  active
                                    ? 'border-primary bg-primary/10 text-foreground'
                                    : 'text-muted-foreground hover:border-primary'
                                }`}
                                onClick={() => addTag(tag)}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                    <div>
                      <PromptAssistPanel
                        prompt={prompt}
                        promptId={promptId}
                        externalEnhanceGoals={scoreEnhanceGoals}
                        onExternalEnhanceConsumed={() => setScoreEnhanceGoals(null)}
                        onApplyGenerate={({ prompt: newPrompt, name, description, variables: newVars }) => {
                          setPrompt(newPrompt);
                          if (name) setPromptName(name);
                          if (description) setPromptDescription(description);
                          if (newVars.length > 0) setVariables(newVars);
                        }}
                        onApplyEnhance={({ prompt: newPrompt, variables: newVars }) => {
                          setPrompt(newPrompt);
                          if (newVars.length > 0) setVariables(newVars);
                        }}
                      />
                    </div>
                    </>
                    ) : null}
                      <div className="flex items-center justify-between mb-2 mt-4">
                        <Label htmlFor="prompt-text" className="text-sm font-medium">Prompt Text *</Label>
                        <Button size="sm" variant="outline" onClick={extractVariablesFromPrompt}>
                          <Sparkles className="w-3 h-3 mr-1" />
                          Extract Variables
                        </Button>
                      </div>
                      {variables.some((variable) => variable.name.trim()) ? (
                        <div className="mb-2 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-muted-foreground">Insert</span>
                          {variables
                            .filter((variable) => variable.name.trim())
                            .map((variable) => (
                              <button
                                key={variable.name}
                                type="button"
                                className="rounded-md border px-2 py-0.5 font-mono text-[11px] hover:border-primary"
                                onClick={() => insertVariable(variable.name)}
                              >
                                {`{{${variable.name}}}`}
                              </button>
                            ))}
                        </div>
                      ) : null}
                      <Textarea
                        id="prompt-text"
                        ref={promptTextRef}
                        placeholder="Enter your prompt here. Use {{variable_name}} for dynamic content..."
                        className={`mt-2 font-mono border-gray-200 focus:border-purple-500 focus:ring-purple-500 ${
                          focusMode ? 'min-h-[60vh]' : 'min-h-[200px]'
                        }`}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                      />
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className={`text-xs ${tokenWarning ? 'text-amber-600' : 'text-gray-500'}`}>
                          {prompt.length} characters · ≈ {promptTokenEstimate} prompt tokens
                          {tokenWarning ? ' — getting long for smaller models' : ''}
                        </p>
                        <p className="text-[11px] text-muted-foreground">⌘Enter to test</p>
                      </div>
                  </CardContent>
                </Card>

                {/* Variables */}
                {!focusMode ? (
                <Card className="shadow-xl border-0 bg-white">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Variables className="w-5 h-5 mr-2 text-blue-600" />
                        Variables
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => void saveTestFixture()}>
                          Save test values
                        </Button>
                        <Button size="sm" variant="outline" onClick={addVariable} className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Variable
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Define variables that can be dynamically replaced in your prompt.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {variables.map((variable, index) => (
                      <div key={index} className="flex items-end space-x-3 p-4 border border-gray-100 rounded-xl bg-gray-50">
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor={`var-name-${index}`} className="text-xs font-medium">Variable Name</Label>
                            <Input
                              id={`var-name-${index}`}
                              placeholder="variable_name"
                              value={variable.name}
                              onChange={(e) => updateVariable(index, 'name', e.target.value)}
                              className="mt-1 border-gray-200"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`var-value-${index}`} className="text-xs font-medium">Test Value</Label>
                            <Input
                              id={`var-value-${index}`}
                              placeholder="Test value"
                              value={variable.value}
                              onChange={(e) => updateVariable(index, 'value', e.target.value)}
                              className="mt-1 border-gray-200"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`var-desc-${index}`} className="text-xs font-medium">Description</Label>
                            <Input
                              id={`var-desc-${index}`}
                              placeholder="Variable description"
                              value={variable.description}
                              onChange={(e) => updateVariable(index, 'description', e.target.value)}
                              className="mt-1 border-gray-200"
                            />
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeVariable(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {variables.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Variables className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No variables defined yet.</p>
                        <p className="text-sm">Add variables to make your prompts dynamic.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                ) : null}
              </TabsContent>

              <TabsContent value="score" className="space-y-6">
                <PromptScorePanel
                  prompt={prompt}
                  promptName={promptName}
                  promptDescription={promptDescription}
                  promptId={promptId}
                  onApplySuggestions={(goals) => setScoreEnhanceGoals(goals)}
                />
              </TabsContent>

              <TabsContent value="test" className="space-y-6">
                {/* Test Interface */}
                <Card className="shadow-xl border-0 bg-white">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <TestTube className="w-5 h-5 mr-2 text-orange-600" />
                        Test Your Prompt
                      </div>
                      <Button
                        onClick={testPrompt}
                        disabled={isTesting || !prompt}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {isTesting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4 mr-2" />
                        )}
                        {isTesting ? 'Testing...' : 'Run Test'}
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Test your prompt with sample data to see how it performs.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Preview */}
                    <div>
                      <Label className="text-sm font-medium">Prompt Preview</Label>
                      <div className="mt-2 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                        <pre className="text-sm whitespace-pre-wrap font-mono">
                          {prompt ? (
                            variables.reduce((text, variable) => {
                              return variable.value
                                ? text.replace(new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g'), `[${variable.value}]`)
                                : text;
                            }, prompt)
                          ) : (
                            <span className="text-gray-400">Enter a prompt to see preview...</span>
                          )}
                        </pre>
                      </div>
                    </div>

                    {/* Output */}
                    <div>
                      <Label className="text-sm font-medium">Test Output</Label>
                      <div className="mt-2 p-4 bg-gray-900 rounded-xl border min-h-[200px] relative overflow-hidden">
                        {isTesting && (
                          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
                            <div className="flex items-center space-x-2 text-green-400">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Executing prompt...</span>
                            </div>
                          </div>
                        )}
                        {testOutput ? (
                          <pre className="text-sm whitespace-pre-wrap text-green-400">{testOutput}</pre>
                        ) : (
                          <div className="flex items-center justify-center h-32 text-gray-500">
                            <div className="text-center">
                              <TestTube className="w-8 h-8 mx-auto mb-2" />
                              <p>Run a test to see the output</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                {/* Model Settings */}
                <Card className="shadow-xl border-0 bg-white">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="flex items-center">
                      <Settings className="w-5 h-5 mr-2 text-purple-600" />
                      Model Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure the AI model and parameters for your prompt.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="model-select" className="text-sm font-medium">AI Model</Label>
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                          <SelectTrigger className="mt-2 border-gray-200">
                            <SelectValue placeholder="Select a model" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">OpenAI</div>
                            <SelectItem value="gpt-4">GPT-4 (Recommended)</SelectItem>
                            <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>

                            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 mt-2">Anthropic Claude</div>
                            <SelectItem value="claude-3-opus">Claude 3 Opus (Most Capable)</SelectItem>
                            <SelectItem value="claude-3-sonnet">Claude 3 Sonnet (Balanced)</SelectItem>
                            <SelectItem value="claude-3-haiku">Claude 3 Haiku (Fastest)</SelectItem>

                            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 mt-2">Cohere</div>
                            <SelectItem value="command-r-plus">Command R+ (Most Capable)</SelectItem>
                            <SelectItem value="command-r">Command R</SelectItem>
                            <SelectItem value="command">Command</SelectItem>
                            <SelectItem value="command-light">Command Light (Fastest)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">
                          Choose the AI model that best fits your use case.
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="temperature" className="text-sm font-medium">
                          Temperature ({temperature})
                        </Label>
                        <div className="mt-2 px-3 py-2 border border-gray-200 rounded-lg">
                          <input
                            type="range"
                            id="temperature"
                            min="0"
                            max="2"
                            step="0.1"
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            className="w-full accent-purple-600"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Controls randomness. Lower values for more focused, higher for more creative responses.
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="max-tokens" className="text-sm font-medium">Max Tokens</Label>
                        <Input
                          id="max-tokens"
                          type="number"
                          min="1"
                          max="4000"
                          value={maxTokens}
                          onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                          className="mt-2 border-gray-200"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Maximum number of tokens in the response.
                        </p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Response Format</Label>
                        <Select value={responseFormat} onValueChange={setResponseFormat}>
                          <SelectTrigger className="mt-2 border-gray-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Plain Text</SelectItem>
                            <SelectItem value="json">JSON</SelectItem>
                            <SelectItem value="markdown">Markdown</SelectItem>
                            <SelectItem value="html">HTML</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <h4 className="font-medium text-gray-900">Advanced Options</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <Label className="text-sm font-medium">Streaming Response</Label>
                            <p className="text-xs text-gray-500">Enable real-time response streaming</p>
                          </div>
                          <Switch checked={streaming} onCheckedChange={setStreaming} />
                        </div>

                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <Label className="text-sm font-medium">Content Filtering</Label>
                            <p className="text-xs text-gray-500">Apply content safety filters</p>
                          </div>
                          <Switch checked={contentFiltering} onCheckedChange={setContentFiltering} />
                        </div>

                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <Label className="text-sm font-medium">Caching</Label>
                            <p className="text-xs text-gray-500">Cache responses for improved performance</p>
                          </div>
                          <Switch checked={caching} onCheckedChange={setCaching} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                <VersionHistory
                  promptId={promptId}
                  currentVersion={{
                    content: prompt,
                    model: selectedModel,
                    temperature,
                    max_tokens: maxTokens,
                  }}
                  refreshKey={versionRefreshKey}
                  onWorkingCopyChange={applyWorkingCopy}
                  onLanesChange={(state) => {
                    setEditingProd(state.editingProd);
                    setDrifted(state.drifted);
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
