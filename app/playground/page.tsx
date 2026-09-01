'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { readStore, writeStore } from '@/lib/local-store';
import { Loader2, Play, Terminal } from 'lucide-react';

interface EndpointOption {
  id: string;
  name: string;
  method: string;
  path: string;
  prompt_id?: string | null;
}

interface PromptOption {
  id: string;
  name: string;
}

interface HistoryItem {
  id: string;
  label: string;
  at: string;
  status: 'ok' | 'error';
  latencyMs?: number;
}

const HISTORY_KEY = 'pp-playground-history';

export default function PlaygroundPage() {
  const [endpoints, setEndpoints] = useState<EndpointOption[]>([]);
  const [prompts, setPrompts] = useState<PromptOption[]>([]);
  const [endpointId, setEndpointId] = useState('');
  const [promptId, setPromptId] = useState('');
  const [body, setBody] = useState('{\n  "input": "Hello from the playground"\n}');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setHistory(readStore<HistoryItem[]>(HISTORY_KEY, []));
    void Promise.all([
      fetch('/api/endpoints', { credentials: 'include' }).then((res) => res.json()),
      fetch('/api/prompts', { credentials: 'include' }).then((res) => res.json()),
    ]).then(([endpointData, promptData]) => {
      const nextEndpoints = Array.isArray(endpointData.endpoints) ? endpointData.endpoints : [];
      const nextPrompts = Array.isArray(promptData.prompts) ? promptData.prompts : [];
      setEndpoints(nextEndpoints);
      setPrompts(nextPrompts);
      if (nextEndpoints[0]) {
        setEndpointId(String(nextEndpoints[0].id));
        if (nextEndpoints[0].prompt_id) setPromptId(String(nextEndpoints[0].prompt_id));
      } else if (nextPrompts[0]) {
        setPromptId(String(nextPrompts[0].id));
      }
    });
  }, []);

  const selectedEndpoint = useMemo(
    () => endpoints.find((item) => item.id === endpointId),
    [endpointId, endpoints]
  );

  useEffect(() => {
    if (selectedEndpoint?.prompt_id) {
      setPromptId(String(selectedEndpoint.prompt_id));
    }
  }, [selectedEndpoint]);

  const run = async () => {
    if (!promptId) {
      toast.error('Select a prompt or an endpoint that is linked to one');
      return;
    }

    let variables: Record<string, unknown> = {};
    try {
      variables = body.trim() ? (JSON.parse(body) as Record<string, unknown>) : {};
    } catch {
      toast.error('Request body must be valid JSON');
      return;
    }

    setLoading(true);
    const started = Date.now();
    try {
      const res = await fetch('/api/llm/execute', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_id: promptId, variables }),
      });
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
      const item: HistoryItem = {
        id: crypto.randomUUID(),
        label: selectedEndpoint ? `${selectedEndpoint.method} ${selectedEndpoint.path}` : promptId,
        at: new Date().toISOString(),
        status: res.ok ? 'ok' : 'error',
        latencyMs: Date.now() - started,
      };
      const next = [item, ...history].slice(0, 12);
      setHistory(next);
      writeStore(HISTORY_KEY, next);
      if (!res.ok) throw new Error(data.error || 'Request failed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Playground request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Runtime"
        title="API Playground"
        description="Send JSON variables through a prompt-backed endpoint and inspect the live model response."
        actions={
          <Button onClick={() => void run()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Send request
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Terminal className="h-4 w-4" />
              Request
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Endpoint</Label>
              <Select value={endpointId} onValueChange={setEndpointId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Optional endpoint" />
                </SelectTrigger>
                <SelectContent>
                  {endpoints.map((endpoint) => (
                    <SelectItem key={endpoint.id} value={endpoint.id}>
                      {endpoint.method} {endpoint.path}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prompt</Label>
              <Select value={promptId} onValueChange={setPromptId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a prompt" />
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
            <div className="md:col-span-2">
              <Label>JSON variables</Label>
              <Textarea
                className="mt-1 min-h-[220px] font-mono text-sm"
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Response</Label>
              <pre className="mt-1 max-h-[320px] overflow-auto rounded-xl border bg-muted/40 p-4 font-mono text-xs">
                {response || 'Send a request to see output.'}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">Runs from this browser appear here.</p>
            ) : (
              history.map((item) => (
                <div key={item.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{item.label}</p>
                    <Badge variant={item.status === 'ok' ? 'secondary' : 'destructive'}>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(item.at).toLocaleTimeString()}
                    {item.latencyMs != null ? ` · ${item.latencyMs}ms` : ''}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
