'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AccountButton } from '@/components/AccountButton';
import { Brain, Command } from 'lucide-react';

export default function AuthHeader() {
  const router = useRouter();
  const [session, setSession] = useState<{ user?: { email?: string; name?: string } } | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/get-session', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setSession(data))
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
  }, []);

  const handleSignOut = async () => {
    await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' });
    setSession(null);
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return <header className="flex justify-end items-center p-4 gap-4 h-16" />;
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 h-16 border-b bg-white/80 backdrop-blur">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-gray-900">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="hidden sm:inline">Prompt Pilot</span>
        </Link>
        {session?.user && (
          <nav className="hidden md:flex items-center gap-4 text-sm text-gray-600">
            <Link href="/prompt-studio" className="hover:text-purple-600 transition-colors">
              Studio
            </Link>
            <Link href="/prompt-scorer" className="hover:text-purple-600 transition-colors">
              Scorer
            </Link>
            <Link href="/api-designer" className="hover:text-purple-600 transition-colors">
              APIs
            </Link>
            <Link href="/deployments" className="hover:text-purple-600 transition-colors">
              Deploy
            </Link>
            <Link href="/analytics" className="hover:text-purple-600 transition-colors">
              Analytics
            </Link>
          </nav>
        )}
      </div>
      <div className="flex items-center gap-3">
        {session?.user && (
          <kbd className="hidden lg:inline-flex items-center gap-1 rounded border bg-gray-50 px-2 py-1 text-xs text-gray-500">
            <Command className="w-3 h-3" />K
          </kbd>
        )}
        {!session?.user ? (
        <>
          <Button variant="outline" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/sign-up">Sign up</Link>
          </Button>
        </>
      ) : (
        <>
          <AccountButton />
          <Button variant="outline" onClick={handleSignOut}>
            Sign out
          </Button>
        </>
        )}
      </div>
    </header>
  );
}
