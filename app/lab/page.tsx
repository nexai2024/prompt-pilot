'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LLM_MODELS } from '@/lib/models';
import { Loader2, Swords } from 'lucide-react';

interface PromptOption {
  id: string;
  name: string;
  content: string;
  model: string;
}

interface RunResult {
  content: string;
  tokens_used: number;
  cost_cents: number;
  latency_ms: number;
  model: string;
}

function VariantPane({
  title,
  prompt,
  model,
  onPromptChange,
  onModelChange,
  result,
  loading,
}: {
  title: string;
  prompt: string;
  model: string;
  onPromptChange: (value: string) => void;
  onModelChange: (value: string) => void;
  result: RunResult | null;
  loading: boolean;
}) {
  return (
    <Card className="min-h-[540px]">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>Model</Label>
          <Select value={model} onValueChange={onModelChange}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LLM_MODELS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Textarea
          className="min-h-[180px] font-mono text-sm"
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          placeholder="Prompt variant..."
        />
        <div className="rounded-xl border bg-muted/40 p-3">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Running…
            </div>
          ) : result ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>{result.latency_ms}ms</span>
                <span>{result.tokens_used} tokens</span>
                <span>${(result.cost_cents / 100).toFixed(4)}</span>
              </div>
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap font-mono text-sm">
                {result.content}
              </pre>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Output appears here after a run.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function LabPage() {
  const [prompts, setPrompts] = useState<PromptOption[]>([]);
  const [input, setInput] = useState('Summarize this for a busy founder:\n\nPrompt Pilot helps teams ship AI APIs.');
  const [promptA, setPromptA] = useState('Rewrite the user input more clearly.\n\n{{input}}');
  const [promptB, setPromptB] = useState('Rewrite the user input in a sharper, shorter voice.\n\n{{input}}');
  const [modelA, setModelA] = useState('gpt-4-turbo');
  const [modelB, setModelB] = useState('claude-3-haiku');
  const [resultA, setResultA] = useState<RunResult | null>(null);
  const [resultB, setResultB] = useState<RunResult | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  useEffect(() => {
    void fetch('/api/prompts', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.prompts)) {
          setPrompts(
            data.prompts.map((prompt: PromptOption) => ({
              id: String(prompt.id),
              name: String(prompt.name),
              content: String(prompt.content || ''),
              model: String(prompt.model || 'gpt-4'),
            }))
          );
        }
      })
      .catch(() => undefined);
  }, []);

  const loadExisting = (id: string, side: 'a' | 'b') => {
    const prompt = prompts.find((item) => item.id === id);
    if (!prompt) return;
    if (side === 'a') {
      setPromptA(prompt.content);
      setModelA(prompt.model);
    } else {
      setPromptB(prompt.content);
      setModelB(prompt.model);
    }
  };

  const runSide = async (side: 'a' | 'b') => {
    const prompt = (side === 'a' ? promptA : promptB).replace(/\{\{input\}\}/g, input);
    const model = side === 'a' ? modelA : modelB;
    const setLoading = side === 'a' ? setLoadingA : setLoadingB;
    const setResult = side === 'a' ? setResultA : setResultB;
    setLoading(true);
    try {
      const response = await fetch('/api/llm/execute', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model, max_tokens: 600, temperature: 0.4 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Run failed');
      setResult(data as RunResult);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Run failed');
    } finally {
      setLoading(false);
    }
  };

  const runBoth = async () => {
    await Promise.all([runSide('a'), runSide('b')]);
  };

  const winner =
    resultA && resultB
      ? resultA.latency_ms === resultB.latency_ms
        ? 'Tie on latency'
        : resultA.latency_ms < resultB.latency_ms
          ? 'A was faster'
          : 'B was faster'
      : null;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Compare"
        title="A/B Lab"
        description="Run two prompt or model variants against the same input. {{input}} is replaced automatically."
        actions={
          <Button onClick={() => void runBoth()} disabled={loadingA || loadingB}>
            {loadingA || loadingB ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Swords className="mr-2 h-4 w-4" />}
            Run both
          </Button>
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Shared input</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <Textarea
            className="min-h-[90px]"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <div className="space-y-3">
            <Select onValueChange={(value) => loadExisting(value, 'a')}>
              <SelectTrigger>
                <SelectValue placeholder="Load prompt into A" />
              </SelectTrigger>
              <SelectContent>
                {prompts.map((prompt) => (
                  <SelectItem key={`a-${prompt.id}`} value={prompt.id}>
                    {prompt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => loadExisting(value, 'b')}>
              <SelectTrigger>
                <SelectValue placeholder="Load prompt into B" />
              </SelectTrigger>
              <SelectContent>
                {prompts.map((prompt) => (
                  <SelectItem key={`b-${prompt.id}`} value={prompt.id}>
                    {prompt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {winner ? <p className="text-sm text-muted-foreground">{winner}</p> : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <VariantPane
          title="Variant A"
          prompt={promptA}
          model={modelA}
          onPromptChange={setPromptA}
          onModelChange={setModelA}
          result={resultA}
          loading={loadingA}
        />
        <VariantPane
          title="Variant B"
          prompt={promptB}
          model={modelB}
          onPromptChange={setPromptB}
          onModelChange={setModelB}
          result={resultB}
          loading={loadingB}
        />
      </div>
    </AppShell>
  );
}
