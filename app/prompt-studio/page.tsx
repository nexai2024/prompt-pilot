'use client';

import { useState, useEffect } from 'react';
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
import { ArrowLeft, Play, Save, Settings, Brain, Zap, Plus, Copy, Trash2, Edit, TestTube, Variable as Variables, History, Download, Upload, RefreshCw, Check, X, AlertTriangle, Sparkles, Code, Wand2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/lib/hooks/useOrganization';

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
  created_at: string;
  updated_at: string;
}

export default function PromptStudio() {
  const { currentOrganization } = useOrganization();

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

  // Load recent prompts
  useEffect(() => {
    if (currentOrganization?.id) {
      loadRecentPrompts();
    }
  }, [currentOrganization]);

  const loadRecentPrompts = async () => {
    try {
      setLoadingPrompts(true);
      const response = await fetch(`/api/prompts?organizationId=${currentOrganization?.id}`);
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

      // Load variables
      const response = await fetch(`/api/prompts/${promptToLoad.id}/variables`);
      const data = await response.json();

      if (response.ok) {
        setVariables(data.variables.map((v: any) => ({
          id: v.id,
          name: v.name,
          value: '',
          type: v.type,
          description: v.description,
          default_value: v.default_value,
          required: v.required
        })));
      }

      toast.success('Prompt loaded successfully');
    } catch (error) {
      toast.error('Failed to load prompt');
    } finally {
      setIsLoading(false);
    }
  };

  const savePrompt = async () => {
    if (!currentOrganization?.id) {
      toast.error('No organization selected');
      return;
    }

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
        organization_id: currentOrganization.id,
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
        status: 'draft'
      };

      let response;
      if (promptId) {
        // Update existing
        response = await fetch(`/api/prompts/${promptId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promptData)
        });
      } else {
        // Create new
        response = await fetch('/api/prompts', {
          method: 'POST',
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

      // Save variables
      if (variables.length > 0) {
        const variablesResponse = await fetch(`/api/prompts/${savedPromptId}/variables`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variables })
        });

        if (!variablesResponse.ok) {
          const varsData = await variablesResponse.json();
          throw new Error(varsData.error || 'Failed to save variables');
        }
      }

      toast.success(promptId ? 'Prompt updated successfully!' : 'Prompt created successfully!');
      loadRecentPrompts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save prompt');
    } finally {
      setIsSaving(false);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: processedPrompt,
          model: selectedModel,
          temperature,
          max_tokens: maxTokens,
          organization_id: currentOrganization?.id
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

  const newPrompt = () => {
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
    toast.success('New prompt created');
  };

  const promptTemplates = [
    {
      name: 'Content Generator',
      description: 'Generate engaging content from topics',
      prompt: 'Create engaging content about {{topic}}. Include key points, examples, and a compelling conclusion.',
      variables: [{ name: 'topic', value: '', type: 'string', description: 'Content topic', required: true }],
      category: 'Content',
      color: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Sentiment Analyzer',
      description: 'Analyze text sentiment and emotions',
      prompt: 'Analyze the sentiment of the following text and provide a detailed breakdown:\n\n{{text}}',
      variables: [{ name: 'text', value: '', type: 'string', description: 'Text to analyze', required: true }],
      category: 'Analysis',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Code Reviewer',
      description: 'Review code for best practices',
      prompt: 'Review the following {{language}} code and provide feedback on best practices, potential issues, and improvements:\n\n{{code}}',
      variables: [
        { name: 'language', value: '', type: 'string', description: 'Programming language', required: true },
        { name: 'code', value: '', type: 'string', description: 'Code to review', required: true }
      ],
      category: 'Development',
      color: 'from-green-500 to-emerald-500'
    },
    {
      name: 'Email Assistant',
      description: 'Draft professional emails',
      prompt: 'Draft a professional email with the following requirements:\nSubject: {{subject}}\nRecipient: {{recipient}}\nContext: {{context}}\nTone: {{tone}}',
      variables: [
        { name: 'subject', value: '', type: 'string', description: 'Email subject', required: true },
        { name: 'recipient', value: '', type: 'string', description: 'Email recipient', required: true },
        { name: 'context', value: '', type: 'string', description: 'Email context', required: true },
        { name: 'tone', value: '', type: 'string', description: 'Email tone', required: true }
      ],
      category: 'Communication',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const loadTemplate = (template: any) => {
    setPrompt(template.prompt);
    setVariables(template.variables);
    setPromptName(template.name);
    setPromptDescription(template.description);
    toast.success(`Template "${template.name}" loaded`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Prompt Studio</h1>
                <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI-Powered
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="hidden sm:flex" onClick={newPrompt}>
                <Plus className="w-4 h-4 mr-2" />
                New Prompt
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
                {isSaving ? 'Saving...' : 'Save Prompt'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Templates */}
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg flex items-center">
                  <Wand2 className="w-5 h-5 mr-2 text-purple-600" />
                  Quick Start Templates
                </CardTitle>
                <CardDescription>Choose a template to get started quickly</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {promptTemplates.map((template, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 group"
                    onClick={() => loadTemplate(template)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm text-gray-900 group-hover:text-purple-600 transition-colors">{template.name}</h4>
                      <Badge variant="outline" className="text-xs">{template.category}</Badge>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{template.description}</p>
                    <div className={`mt-2 h-1 bg-gradient-to-r ${template.color} rounded-full opacity-60`}></div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Prompts */}
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg flex items-center">
                  <History className="w-5 h-5 mr-2 text-blue-600" />
                  Recent Prompts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {loadingPrompts ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  </div>
                ) : recentPrompts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No prompts yet. Create your first one!</p>
                ) : (
                  recentPrompts.slice(0, 5).map((recentPrompt) => (
                    <div
                      key={recentPrompt.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      onClick={() => loadPrompt(recentPrompt)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{recentPrompt.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(recentPrompt.updated_at).toLocaleDateString()}
                        </p>
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

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="editor" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-xl">
                <TabsTrigger value="editor" className="rounded-lg">Prompt Editor</TabsTrigger>
                <TabsTrigger value="test" className="rounded-lg">Test & Debug</TabsTrigger>
                <TabsTrigger value="settings" className="rounded-lg">Model Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="space-y-6">
                {/* Prompt Editor */}
                <Card className="shadow-xl border-0 bg-white">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="flex items-center">
                      <Edit className="w-5 h-5 mr-2 text-green-600" />
                      Prompt Editor
                    </CardTitle>
                    <CardDescription>
                      Create your AI prompt. Use {'{{variable_name}}'} syntax for dynamic variables.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
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
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="prompt-text" className="text-sm font-medium">Prompt Text *</Label>
                        <Button size="sm" variant="outline" onClick={extractVariablesFromPrompt}>
                          <Sparkles className="w-3 h-3 mr-1" />
                          Extract Variables
                        </Button>
                      </div>
                      <Textarea
                        id="prompt-text"
                        placeholder="Enter your prompt here. Use {{variable_name}} for dynamic content..."
                        className="mt-2 min-h-[200px] font-mono border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">
                          {prompt.length} characters
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Variables */}
                <Card className="shadow-xl border-0 bg-white">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Variables className="w-5 h-5 mr-2 text-blue-600" />
                        Variables
                      </div>
                      <Button size="sm" variant="outline" onClick={addVariable} className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Variable
                      </Button>
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
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
