'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  BarChart3,
  Brain,
  Code,
  FlaskConical,
  Home,
  LayoutTemplate,
  Rocket,
  Settings,
  Sparkles,
  Terminal,
} from 'lucide-react';

interface PromptOption {
  id: string;
  name: string;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [prompts, setPrompts] = useState<PromptOption[]>([]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;

    void fetch('/api/prompts', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.prompts)) {
          setPrompts(
            data.prompts.slice(0, 8).map((p: { id: string; name: string }) => ({
              id: String(p.id),
              name: String(p.name),
            }))
          );
        }
      })
      .catch(() => undefined);
  }, [open]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages and prompts..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => navigate('/dashboard')}>
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => navigate('/prompt-studio')}>
            <Brain className="mr-2 h-4 w-4" />
            Prompt Studio
          </CommandItem>
          <CommandItem onSelect={() => navigate('/templates')}>
            <LayoutTemplate className="mr-2 h-4 w-4" />
            Templates
          </CommandItem>
          <CommandItem onSelect={() => navigate('/lab')}>
            <FlaskConical className="mr-2 h-4 w-4" />
            A/B Lab
          </CommandItem>
          <CommandItem onSelect={() => navigate('/playground')}>
            <Terminal className="mr-2 h-4 w-4" />
            API Playground
          </CommandItem>
          <CommandItem onSelect={() => navigate('/evals')}>
            <Sparkles className="mr-2 h-4 w-4" />
            Eval Suites
          </CommandItem>
          <CommandItem onSelect={() => navigate('/prompt-scorer')}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Prompt Scorer
          </CommandItem>
          <CommandItem onSelect={() => navigate('/api-designer')}>
            <Code className="mr-2 h-4 w-4" />
            API Designer
          </CommandItem>
          <CommandItem onSelect={() => navigate('/deployments')}>
            <Rocket className="mr-2 h-4 w-4" />
            Deployments
          </CommandItem>
          <CommandItem onSelect={() => navigate('/analytics')}>
            <Sparkles className="mr-2 h-4 w-4" />
            Analytics
          </CommandItem>
          <CommandItem onSelect={() => navigate('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </CommandItem>
        </CommandGroup>
        {prompts.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent prompts">
              {prompts.map((prompt) => (
                <CommandItem
                  key={prompt.id}
                  onSelect={() => navigate(`/prompt-studio?promptId=${prompt.id}`)}
                >
                  <Brain className="mr-2 h-4 w-4" />
                  {prompt.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
