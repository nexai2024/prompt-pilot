'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AccountButton } from '@/components/AccountButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationCenter } from '@/components/NotificationCenter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Brain, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const AUTH_ONLY_PATHS = new Set(['/sign-in', '/sign-up', '/reset-password', '/auth/callback']);

const NAV = [
  { id: 'home', label: 'Home', href: '/dashboard' },
  {
    id: 'build',
    label: 'Build',
    href: '/prompt-studio',
    children: [
      { href: '/prompt-studio', label: 'Prompt Studio', hint: 'Write and version prompts' },
      { href: '/templates', label: 'Templates', hint: 'Start from a recipe' },
      { href: '/api-designer', label: 'API Designer', hint: 'Map a prompt to an endpoint' },
    ],
  },
  {
    id: 'test',
    label: 'Test',
    href: '/playground',
    children: [
      { href: '/playground', label: 'Playground', hint: 'Send a live request' },
      { href: '/evals', label: 'Eval Suites', hint: 'Batch-test cases' },
      { href: '/lab', label: 'A/B Lab', hint: 'Compare two variants' },
      { href: '/prompt-scorer', label: 'Scorer', hint: 'Score prompt quality' },
    ],
  },
  {
    id: 'ship',
    label: 'Ship',
    href: '/deployments',
    children: [
      { href: '/deployments', label: 'Deployments', hint: 'Publish and health-check' },
      { href: '/releases', label: 'Release notes', hint: 'Production changelogs' },
      { href: '/analytics', label: 'Analytics', hint: 'Usage, latency, and cost' },
    ],
  },
  { id: 'settings', label: 'Settings', href: '/settings' },
] as const;

function pathMatches(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupIsActive(
  pathname: string | null,
  item: (typeof NAV)[number]
) {
  if ('children' in item && item.children) {
    return item.children.some((child) => pathMatches(pathname, child.href));
  }
  return pathMatches(pathname, item.href);
}

export default function AuthHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<{ user?: { email?: string; name?: string } } | null>(
    null
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/get-session', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        const user = data?.user || data?.session?.user || null;
        setSession(user ? { user } : null);
      })
      .catch(() => setSession(null))
      .finally(() => setLoading(false));

    fetch('/api/profile', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.avatarUrl) setAvatarUrl(String(data.user.avatarUrl));
      })
      .catch(() => undefined);
  }, []);

  const handleSignOut = async () => {
    await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' });
    setSession(null);
    router.push('/');
    router.refresh();
  };

  if (AUTH_ONLY_PATHS.has(pathname || '')) {
    return null;
  }

  const isAuthed = Boolean(session?.user);

  if (loading) {
    return <header className="h-14 border-b bg-background/80 backdrop-blur" />;
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href={isAuthed ? '/dashboard' : '/'}
          className="flex shrink-0 items-center gap-2 font-semibold"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-500">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <span className="hidden sm:inline">Prompt Pilot</span>
        </Link>

        {isAuthed ? (
          <nav className="flex min-w-0 items-center gap-0.5">
            {NAV.map((item) => {
              const active = groupIsActive(pathname, item);
              if (!('children' in item)) {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground',
                      active && 'bg-accent font-medium text-foreground'
                    )}
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <DropdownMenu key={item.id}>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-muted-foreground outline-none hover:bg-accent hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-foreground',
                        active && 'bg-accent font-medium text-foreground'
                      )}
                    >
                      {item.label}
                      <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    {item.children.map((child) => (
                      <DropdownMenuItem key={child.href} asChild>
                        <Link href={child.href} className="flex flex-col items-start gap-0.5">
                          <span
                            className={cn(
                              'text-sm',
                              pathMatches(pathname, child.href) && 'font-medium'
                            )}
                          >
                            {child.label}
                          </span>
                          <span className="text-xs text-muted-foreground">{child.hint}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })}
          </nav>
        ) : (
          <nav className="hidden items-center gap-5 sm:flex">
            <Link href="/templates" className="text-sm text-muted-foreground hover:text-foreground">
              Templates
            </Link>
            <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground">
              Features
            </Link>
          </nav>
        )}

        <div className="flex shrink-0 items-center gap-1.5">
          {isAuthed ? <NotificationCenter /> : null}
          <ThemeToggle />
          {!isAuthed ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Sign up</Link>
              </Button>
            </>
          ) : (
            <>
              {avatarUrl ? (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl} alt={session?.user?.name || 'Profile'} />
                  <AvatarFallback>
                    {(session?.user?.name || session?.user?.email || '?')
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : null}
              <AccountButton />
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
