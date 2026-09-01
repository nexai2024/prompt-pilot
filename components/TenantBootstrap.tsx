'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const APP_ROUTES = [
  '/dashboard',
  '/prompt-studio',
  '/api-designer',
  '/deployments',
  '/analytics',
  '/settings',
  '/prompt-scorer',
  '/templates',
  '/lab',
  '/playground',
  '/evals',
];

function isPlatformHost(hostname: string): boolean {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      if (hostname === new URL(appUrl).hostname) return true;
    } catch {
      // ignore invalid URL
    }
  }

  const base =
    process.env.NEXT_PUBLIC_BASE_DOMAIN ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '').split('/')[0] ||
    'beta.promptpilot.run';

  return (
    hostname === base ||
    hostname === `www.${base}` ||
    hostname === `app.${base}` ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1'
  );
}

export function TenantBootstrap() {
  const pathname = usePathname();
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname;
    if (!isPlatformHost(hostname)) return;

    const onAppRoute =
      pathname === '/' ||
      APP_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
      );

    if (!onAppRoute) return;

    bootstrapped.current = true;

    async function bootstrap() {
      try {
        const sessionRes = await fetch('/api/auth/get-session', {
          credentials: 'include',
        });
        const session = await sessionRes.json();
        if (!session?.user) return;

        const contextRes = await fetch('/api/tenant/context', {
          credentials: 'include',
        });
        const data = await contextRes.json();
        if (!contextRes.ok || !data.tenant?.tenantAppUrl) return;

        const targetPath = pathname === '/' ? '/dashboard' : pathname;
        const target = `${data.tenant.tenantAppUrl}${targetPath}${window.location.search}`;
        if (target !== window.location.href) {
          window.location.replace(target);
        }
      } catch {
        // ignore bootstrap failures
      }
    }

    void bootstrap();
  }, [pathname]);

  return null;
}
