'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Check, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { readStore, writeStore } from '@/lib/local-store';

interface ChecklistItem {
  id: string;
  label: string;
  href: string;
  done: boolean;
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: 'template', label: 'Clone a prompt template', href: '/templates', done: false },
  { id: 'score', label: 'Score a prompt', href: '/prompt-scorer', done: false },
  { id: 'lab', label: 'Run an A/B comparison', href: '/lab', done: false },
  { id: 'eval', label: 'Create an eval suite', href: '/evals', done: false },
  { id: 'play', label: 'Send a playground request', href: '/playground', done: false },
];

export function GettingStarted() {
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_ITEMS);

  useEffect(() => {
    setItems(readStore('pp-getting-started', DEFAULT_ITEMS));
  }, []);

  const toggle = (id: string) => {
    const next = items.map((item) => (item.id === id ? { ...item, done: !item.done } : item));
    setItems(next);
    writeStore('pp-getting-started', next);
  };

  const completed = items.filter((item) => item.done).length;
  if (completed === items.length) return null;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-base">Getting started</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
            <button
              type="button"
              className="flex items-center gap-2 text-sm"
              onClick={() => toggle(item.id)}
            >
              {item.done ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={item.done ? 'text-muted-foreground line-through' : ''}>{item.label}</span>
            </button>
            <Link href={item.href} className="text-xs text-primary hover:underline">
              Open
            </Link>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
