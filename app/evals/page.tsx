'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { readStore, writeStore } from '@/lib/local-store';
import { CheckCircle2, Loader2, Plus, Trash2, Play } from 'lucide-react';

interface PromptOption {
  id: string;
  name: string;
}

interface EvalCase {
  id: string;
  name: string;
  variablesJson: string;
  mustContain: string;
}

interface EvalSuite {
  id: string;
  name: string;
  promptId: string;
  cases: EvalCase[];
}

interface CaseResult {
  id: string;
  passed: boolean;
  output: string;
  error?: string;
}

const STORE_KEY = 'pp-eval-suites';

function emptyCase(): EvalCase {
  return {
    id: crypto.randomUUID(),
    name: 'Case',
    variablesJson: '{\n  "input": ""\n}',
    mustContain: '',
  };
}

export default function EvalsPage() {
  const [prompts, setPrompts] = useState<PromptOption[]>([]);
  const [suites, setSuites] = useState<EvalSuite[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<CaseResult[]>([]);

  useEffect(() => {
    const stored = readStore<EvalSuite[]>(STORE_KEY, []);
    setSuites(stored);
    setActiveId(stored[0]?.id ?? null);
    void fetch('/api/prompts', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.prompts)) {
          setPrompts(data.prompts.map((prompt: PromptOption) => ({ id: String(prompt.id), name: String(prompt.name) })));
        }
      });
  }, []);

  const persist = (next: EvalSuite[]) => {
    setSuites(next);
    writeStore(STORE_KEY, next);
  };

  const active = useMemo(
    () => suites.find((suite) => suite.id === activeId) || null,
    [activeId, suites]
  );

  const updateActive = (patch: Partial<EvalSuite>) => {
    if (!active) return;
    persist(suites.map((suite) => (suite.id === active.id ? { ...suite, ...patch } : suite)));
  };

  const createSuite = () => {
    const suite: EvalSuite = {
      id: crypto.randomUUID(),
      name: 'New eval suite',
      promptId: prompts[0]?.id || '',
      cases: [emptyCase()],
    };
    persist([suite, ...suites]);
    setActiveId(suite.id);
    setResults([]);
  };

  const runSuite = async () => {
    if (!active?.promptId) {
      toast.error('Select a prompt for this suite');
      return;
    }
    setRunning(true);
    setResults([]);
    const nextResults: CaseResult[] = [];
    try {
      for (const testCase of active.cases) {
        let variables: Record<string, unknown> = {};
        try {
          variables = JSON.parse(testCase.variablesJson) as Record<string, unknown>;
        } catch {
          nextResults.push({
            id: testCase.id,
            passed: false,
            output: '',
            error: 'Invalid JSON',
          });
          continue;
        }

        const response = await fetch('/api/llm/execute', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt_id: active.promptId, variables, max_tokens: 400, temperature: 0.2 }),
        });
        const data = await response.json();
        const output = String(data.content || data.error || '');
        const needle = testCase.mustContain.trim().toLowerCase();
        const passed = response.ok && (!needle || output.toLowerCase().includes(needle));
        nextResults.push({
          id: testCase.id,
          passed,
          output,
          error: response.ok ? undefined : String(data.error || 'Failed'),
        });
      }
      setResults(nextResults);
      const passedCount = nextResults.filter((item) => item.passed).length;
      toast.success(`${passedCount}/${nextResults.length} cases passed`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Eval run failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Quality"
        title="Eval suites"
        description="Save input cases and required phrases, then batch-run them against a prompt."
        actions={
          <>
            <Button variant="outline" onClick={createSuite}>
              <Plus className="mr-2 h-4 w-4" />
              New suite
            </Button>
            <Button onClick={() => void runSuite()} disabled={!active || running}>
              {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Run suite
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suites.length === 0 ? (
              <p className="text-sm text-muted-foreground">Create a suite to get started.</p>
            ) : (
              suites.map((suite) => (
                <button
                  key={suite.id}
                  type="button"
                  onClick={() => {
                    setActiveId(suite.id);
                    setResults([]);
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                    suite.id === activeId ? 'border-primary bg-accent' : 'hover:bg-muted'
                  }`}
                >
                  {suite.name}
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {active ? (
          <div className="space-y-4">
            <Card>
              <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
                <div>
                  <Label>Suite name</Label>
                  <Input
                    className="mt-1"
                    value={active.name}
                    onChange={(event) => updateActive({ name: event.target.value })}
                  />
                </div>
                <div>
                  <Label>Prompt</Label>
                  <Select value={active.promptId} onValueChange={(promptId) => updateActive({ promptId })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose prompt" />
                    </SelectTrigger>
                    <SelectContent>
                      {prompts.map((prompt) => (
                        <SelectItem key={prompt.id} value={prompt.id}>
                          {prompt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {active.cases.map((testCase, index) => {
              const result = results.find((item) => item.id === testCase.id);
              return (
                <Card key={testCase.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base">Case {index + 1}</CardTitle>
                    <div className="flex items-center gap-2">
                      {result ? (
                        <Badge variant={result.passed ? 'secondary' : 'destructive'}>
                          {result.passed ? 'Pass' : 'Fail'}
                        </Badge>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          updateActive({ cases: active.cases.filter((item) => item.id !== testCase.id) })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>Name</Label>
                      <Input
                        className="mt-1"
                        value={testCase.name}
                        onChange={(event) => {
                          const cases = active.cases.map((item) =>
                            item.id === testCase.id ? { ...item, name: event.target.value } : item
                          );
                          updateActive({ cases });
                        }}
                      />
                    </div>
                    <div>
                      <Label>Must contain</Label>
                      <Input
                        className="mt-1"
                        value={testCase.mustContain}
                        onChange={(event) => {
                          const cases = active.cases.map((item) =>
                            item.id === testCase.id ? { ...item, mustContain: event.target.value } : item
                          );
                          updateActive({ cases });
                        }}
                        placeholder="Optional phrase"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Variables JSON</Label>
                      <Textarea
                        className="mt-1 min-h-[120px] font-mono text-sm"
                        value={testCase.variablesJson}
                        onChange={(event) => {
                          const cases = active.cases.map((item) =>
                            item.id === testCase.id ? { ...item, variablesJson: event.target.value } : item
                          );
                          updateActive({ cases });
                        }}
                      />
                    </div>
                    {result?.output ? (
                      <pre className="md:col-span-2 max-h-40 overflow-auto rounded-lg bg-muted p-3 font-mono text-xs">
                        {result.output}
                      </pre>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}

            <Button
              variant="outline"
              onClick={() => updateActive({ cases: [...active.cases, emptyCase()] })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add case
            </Button>
          </div>
        ) : (
          <Card className="flex min-h-[280px] items-center justify-center">
            <div className="text-center text-muted-foreground">
              <CheckCircle2 className="mx-auto mb-3 h-8 w-8" />
              <p>Create a suite to batch-test a prompt.</p>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
