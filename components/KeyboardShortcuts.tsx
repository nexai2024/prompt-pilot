'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OPEN_SHORTCUTS } from '@/lib/recents';

const SHORTCUTS = [
  { keys: ['⌘', 'K'], action: 'Search pages and prompts' },
  { keys: ['?'], action: 'Open this shortcuts list' },
  { keys: ['⌘', 'S'], action: 'Save the prompt in Studio' },
  { keys: ['⌘', 'Enter'], action: 'Run a Studio test' },
  { keys: ['⌘', '.'], action: 'Toggle Studio focus mode' },
  { keys: ['Esc'], action: 'Leave focus mode' },
];

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === '?' && !event.metaKey && !event.ctrlKey && !isTypingTarget(event.target)) {
        event.preventDefault();
        setOpen((value) => !value);
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === '/') {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };

    const onOpen = () => setOpen(true);

    document.addEventListener('keydown', onKeyDown);
    window.addEventListener(OPEN_SHORTCUTS, onOpen);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener(OPEN_SHORTCUTS, onOpen);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Move around the workspace without leaving the keyboard.</DialogDescription>
        </DialogHeader>
        <ul className="space-y-3">
          {SHORTCUTS.map((shortcut) => (
            <li key={shortcut.action} className="flex items-center justify-between gap-4 text-sm">
              <span>{shortcut.action}</span>
              <span className="flex items-center gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="rounded-md border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
                  >
                    {key}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
