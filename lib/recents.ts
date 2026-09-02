import { readStore, writeStore } from '@/lib/local-store';

export interface RecentPage {
  href: string;
  label: string;
  at: number;
}

export interface LastPrompt {
  id: string;
  name: string;
  at: number;
}

const PAGES_KEY = 'pp-recent-pages';
const PROMPT_KEY = 'pp-last-prompt';
const MAX_PAGES = 8;

const PAGE_LABELS: Array<{ test: (path: string) => boolean; label: string }> = [
  { test: (path) => path.startsWith('/prompt-studio'), label: 'Prompt Studio' },
  { test: (path) => path.startsWith('/templates'), label: 'Templates' },
  { test: (path) => path.startsWith('/api-designer'), label: 'API Designer' },
  { test: (path) => path.startsWith('/playground'), label: 'Playground' },
  { test: (path) => path.startsWith('/evals'), label: 'Eval Suites' },
  { test: (path) => path.startsWith('/lab'), label: 'A/B Lab' },
  { test: (path) => path.startsWith('/prompt-scorer'), label: 'Scorer' },
  { test: (path) => path.startsWith('/deployments'), label: 'Deployments' },
  { test: (path) => path.startsWith('/releases'), label: 'Release notes' },
  { test: (path) => path.startsWith('/analytics'), label: 'Analytics' },
  { test: (path) => path.startsWith('/settings'), label: 'Settings' },
  { test: (path) => path.startsWith('/dashboard'), label: 'Dashboard' },
];

export function labelForPath(pathname: string): string | null {
  if (pathname === '/' || pathname.startsWith('/sign-') || pathname.startsWith('/auth')) {
    return null;
  }
  return PAGE_LABELS.find((entry) => entry.test(pathname))?.label ?? null;
}

export function rememberPage(href: string, label: string): void {
  const path = href.split('?')[0] || href;
  const pages = getRecentPages().filter((page) => page.href.split('?')[0] !== path);
  writeStore<RecentPage[]>(PAGES_KEY, [{ href, label, at: Date.now() }, ...pages].slice(0, MAX_PAGES));
}

export function getRecentPages(): RecentPage[] {
  const pages = readStore<RecentPage[]>(PAGES_KEY, []);
  return Array.isArray(pages) ? pages : [];
}

export function rememberPrompt(id: string, name: string): void {
  if (!id) return;
  writeStore<LastPrompt>(PROMPT_KEY, { id, name: name || 'Untitled prompt', at: Date.now() });
}

export function getLastPrompt(): LastPrompt | null {
  const last = readStore<LastPrompt | null>(PROMPT_KEY, null);
  if (!last?.id) return null;
  return last;
}

export const OPEN_COMMAND_PALETTE = 'pp-open-command-palette';
export const OPEN_SHORTCUTS = 'pp-open-shortcuts';

export function openCommandPalette(): void {
  window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE));
}

export function openShortcutsOverlay(): void {
  window.dispatchEvent(new Event(OPEN_SHORTCUTS));
}
