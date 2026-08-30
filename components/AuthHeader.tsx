'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AccountButton } from '@/components/AccountButton';

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
    <header className="flex justify-end items-center p-4 gap-4 h-16">
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
    </header>
  );
}
