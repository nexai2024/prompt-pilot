'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AccountButton } from '@/components/AccountButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationCenter } from '@/components/NotificationCenter';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  FlaskConical,
  LayoutTemplate,
  ListChecks,
  Terminal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AUTH_ONLY_PATHS = new Set(['/sign-in', '/sign-up', '/reset-password', '/auth/callback']);

const PRIMARY_LINKS = [
  { href: '/dashboard', label: 'Home' },
  { href: '/templates', label: 'Templates', isNew: true },
  { href: '/playground', label: 'Playground', isNew: true },
  { href: '/evals', label: 'Eval Suites', isNew: true },
  { href: '/lab', label: 'A/B Lab', isNew: true },
  { href: '/prompt-studio', label: 'Studio' },
  { href: '/api-designer', label: 'APIs' },
  { href: '/deployments', label: 'Deploy' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/prompt-scorer', label: 'Scorer' },
  { href: '/settings', label: 'Settings' },
];

const FEATURE_LINKS = [
  { href: '/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/playground', label: 'Playground', icon: Terminal },
  { href: '/evals', label: 'Eval Suites', icon: ListChecks },
  { href: '/lab', label: 'A/B Lab', icon: FlaskConical },
];

export default function AuthHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<{ user?: { email?: string; name?: string } } | null>(
    null
  );
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
  const showAppNav = isAuthed;

  if (loading) {
    return <header className="h-16 border-b bg-background/80 backdrop-blur" />;
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-3 px-3 sm:px-6">
        <Link href={showAppNav ? '/dashboard' : '/'} className="flex shrink-0 items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-500">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <span className="hidden sm:inline">Prompt Pilot</span>
        </Link>

        {showAppNav ? (
          <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {PRIMARY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground',
                  pathname === link.href || pathname?.startsWith(`${link.href}/`)
                    ? 'bg-accent font-medium text-foreground'
                    : ''
                )}
              >
                {link.label}
                {link.isNew ? (
                  <Badge className="h-4 px-1 text-[9px] leading-none">New</Badge>
                ) : null}
              </Link>
            ))}
          </nav>
        ) : (
          <nav className="hidden items-center gap-4 sm:flex">
            <Link href="/templates" className="text-sm text-muted-foreground hover:text-foreground">
              Templates
            </Link>
            <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground">
              Features
            </Link>
          </nav>
        )}

        <div className="flex shrink-0 items-center gap-1.5">
          {showAppNav ? <NotificationCenter /> : null}
          <ThemeToggle />
          {!showAppNav ? (
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
              <AccountButton />
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          )}
        </div>
      </div>

      {showAppNav ? (
        <div className="border-t bg-muted/50">
          <div className="mx-auto flex max-w-[1400px] items-center gap-2 overflow-x-auto px-3 py-2 sm:px-6">
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              New
            </span>
            {FEATURE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-sm hover:border-primary',
                  pathname === link.href ? 'border-primary text-foreground' : 'text-muted-foreground'
                )}
              >
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
