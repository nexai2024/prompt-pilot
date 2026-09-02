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
  Clock,
  Code,
  FlaskConical,
  Home,
  LayoutTemplate,
  Rocket,
  ScrollText,
  Settings,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { getLastPrompt, getRecentPages, OPEN_COMMAND_PALETTE } from '@/lib/recents';

interface PromptOption {
  id: string;
  name: string;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [prompts, setPrompts] = useState<PromptOption[]>([]);
  const [recentPages, setRecentPages] = useState<Array<{ href: string; label: string }>>([]);
  const [lastPrompt, setLastPrompt] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };

    const onOpen = () => setOpen(true);

    document.addEventListener('keydown', onKeyDown);
    window.addEventListener(OPEN_COMMAND_PALETTE, onOpen);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener(OPEN_COMMAND_PALETTE, onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    setRecentPages(getRecentPages().map((page) => ({ href: page.href, label: page.label })));
    setLastPrompt(getLastPrompt());

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
        {(lastPrompt || recentPages.length > 0) && (
          <CommandGroup heading="Continue">
            {lastPrompt ? (
              <CommandItem onSelect={() => navigate(`/prompt-studio?promptId=${lastPrompt.id}`)}>
                <Clock className="mr-2 h-4 w-4" />
                Resume {lastPrompt.name}
              </CommandItem>
            ) : null}
            {recentPages.slice(0, 5).map((page) => (
              <CommandItem key={page.href} onSelect={() => navigate(page.href)}>
                <Clock className="mr-2 h-4 w-4" />
                {page.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandGroup heading="Home">
          <CommandItem onSelect={() => navigate('/dashboard')}>
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Build">
          <CommandItem onSelect={() => navigate('/prompt-studio')}>
            <Brain className="mr-2 h-4 w-4" />
            Prompt Studio
          </CommandItem>
          <CommandItem onSelect={() => navigate('/templates')}>
            <LayoutTemplate className="mr-2 h-4 w-4" />
            Templates
          </CommandItem>
          <CommandItem onSelect={() => navigate('/api-designer')}>
            <Code className="mr-2 h-4 w-4" />
            API Designer
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Test">
          <CommandItem onSelect={() => navigate('/playground')}>
            <Terminal className="mr-2 h-4 w-4" />
            Playground
          </CommandItem>
          <CommandItem onSelect={() => navigate('/evals')}>
            <Sparkles className="mr-2 h-4 w-4" />
            Eval Suites
          </CommandItem>
          <CommandItem onSelect={() => navigate('/lab')}>
            <FlaskConical className="mr-2 h-4 w-4" />
            A/B Lab
          </CommandItem>
          <CommandItem onSelect={() => navigate('/prompt-scorer')}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Scorer
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Ship">
          <CommandItem onSelect={() => navigate('/deployments')}>
            <Rocket className="mr-2 h-4 w-4" />
            Deployments
          </CommandItem>
          <CommandItem onSelect={() => navigate('/releases')}>
            <ScrollText className="mr-2 h-4 w-4" />
            Release notes
          </CommandItem>
          <CommandItem onSelect={() => navigate('/analytics')}>
            <Sparkles className="mr-2 h-4 w-4" />
            Analytics
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Settings">
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
