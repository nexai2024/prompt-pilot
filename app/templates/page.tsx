'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PROMPT_TEMPLATES, TEMPLATE_CATEGORIES, type PromptTemplate } from '@/lib/prompt-templates';
import { LayoutTemplate, Loader2, Search } from 'lucide-react';

export default function TemplatesPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof TEMPLATE_CATEGORIES)[number]['id']>('all');
  const [usingId, setUsingId] = useState<string | null>(null);

  const templates = useMemo(() => {
    return PROMPT_TEMPLATES.filter((template) => {
      const matchesCategory = category === 'all' || template.category === category;
      const haystack = `${template.name} ${template.description} ${template.content}`.toLowerCase();
      return matchesCategory && haystack.includes(query.toLowerCase());
    });
  }, [category, query]);

  const useTemplate = async (template: PromptTemplate) => {
    try {
      setUsingId(template.id);
      const response = await fetch('/api/prompts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          content: template.content,
          model: template.model,
          temperature: template.temperature,
          max_tokens: template.maxTokens,
          status: 'draft',
        }),
      });
      if (response.status === 401) {
        router.push(`/sign-in?redirect=/templates`);
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create prompt');

      const promptId = data.prompt?.id;
      if (promptId && template.variables.length > 0) {
        await fetch(`/api/prompts/${promptId}/variables`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variables: template.variables }),
        });
      }

      toast.success('Template added to Studio');
      router.push(promptId ? `/prompt-studio?promptId=${promptId}` : '/prompt-studio');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not use template');
    } finally {
      setUsingId(null);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Library"
        title="Prompt templates"
        description="Clone a production-ready starting point, then score, eval, and deploy it."
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search templates"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_CATEGORIES.map((item) => (
            <Button
              key={item.id}
              size="sm"
              variant={category === item.id ? 'default' : 'outline'}
              onClick={() => setCategory(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="flex flex-col">
            <CardHeader>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                  <LayoutTemplate className="h-4 w-4" />
                </div>
                <Badge variant="outline" className="capitalize">
                  {template.category}
                </Badge>
              </div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto space-y-4">
              <pre className="line-clamp-5 overflow-hidden rounded-lg bg-muted p-3 font-mono text-xs text-muted-foreground">
                {template.content}
              </pre>
              <Button
                className="w-full"
                disabled={usingId === template.id}
                onClick={() => void useTemplate(template)}
              >
                {usingId === template.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Use template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
