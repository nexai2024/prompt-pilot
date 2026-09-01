import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { setTenantSubdomainCookie } from '@/lib/cookie-utils';
import {
  analyzeTenantHost,
  buildTenantRedirectUrl,
  gatewayRewriteUrl,
  getRequestHost,
  isPlatformHost,
  isTenantAppRoute,
  shouldRewriteToGateway,
  TENANT_SUBDOMAIN_COOKIE,
} from '@/lib/tenant-routing';
import { getBaseDomain } from '@/lib/tenant-domains';

const publicRoutes = [
  '/',
  '/sign-in',
  '/sign-up',
  '/reset-password',
  '/auth/callback',
  '/templates',
];

function isPublicRoute(pathname: string): boolean {
  if (publicRoutes.includes(pathname)) return true;
  if (pathname.startsWith('/api/auth')) return true;
  if (pathname.startsWith('/api/gateway')) return true;
  if (pathname.startsWith('/api/tenant')) return true;
  if (pathname === '/api/auth-providers') return true;
  return false;
}

function hasSessionCookie(request: NextRequest): boolean {
  const cookieHeader = request.headers.get('cookie') || '';
  return (
    cookieHeader.includes('better-auth.session_token=') ||
    cookieHeader.includes('__Secure-better-auth.session_token=')
  );
}

function getVanityFromCookie(request: NextRequest): string | null {
  return request.cookies.get(TENANT_SUBDOMAIN_COOKIE)?.value || null;
}

function shouldRedirectToTenantApp(request: NextRequest): string | null {
  const host = getRequestHost(request.headers);
  if (!isPlatformHost(host)) return null;
  if (host === 'localhost' || host === '127.0.0.1') return null;
  if (!hasSessionCookie(request)) return null;

  const vanity = getVanityFromCookie(request);
  if (!vanity) return null;

  const { pathname, search } = request.nextUrl;

  if (pathname === '/' && !search.includes('redirect=')) {
    return buildTenantRedirectUrl(vanity, '/dashboard', search);
  }

  const appRoutes = [
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

  if (appRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return buildTenantRedirectUrl(vanity, pathname, search);
  }

  return null;
}

async function redirectCustomDomainAppRoute(
  request: NextRequest,
  host: string,
  pathname: string
): Promise<NextResponse | null> {
  const vanity = getVanityFromCookie(request);
  if (vanity) {
    return NextResponse.redirect(
      buildTenantRedirectUrl(vanity, pathname, request.nextUrl.search)
    );
  }

  try {
    const resolveUrl = new URL('/api/tenant/resolve-host', request.url);
    resolveUrl.searchParams.set('host', host);
    const res = await fetch(resolveUrl.toString(), {
      headers: { 'x-forwarded-host': host },
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      vanitySubdomain?: string;
      tenantAppUrl?: string;
    };

    if (!data.tenantAppUrl) return null;

    const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
    const redirect = NextResponse.redirect(
      `${data.tenantAppUrl}${path}${request.nextUrl.search}`
    );

    if (data.vanitySubdomain) {
      setTenantSubdomainCookie(redirect, data.vanitySubdomain, host);
    }

    return redirect;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const host = getRequestHost(request.headers);
  const { pathname } = request.nextUrl;
  const tenant = analyzeTenantHost(host);

  if (shouldRewriteToGateway(host, pathname)) {
    const rewriteUrl = gatewayRewriteUrl(request.nextUrl, pathname);
    return NextResponse.rewrite(rewriteUrl);
  }

  if (
    tenant.isTenant &&
    tenant.isCustomDomain &&
    isTenantAppRoute(pathname) &&
    !isPublicRoute(pathname)
  ) {
    const customRedirect = await redirectCustomDomainAppRoute(
      request,
      host,
      pathname
    );
    if (customRedirect) return customRedirect;

    const platformUrl = new URL('/dashboard', request.url);
    platformUrl.hostname = getBaseDomain();
    return NextResponse.redirect(platformUrl);
  }

  const tenantRedirect = shouldRedirectToTenantApp(request);
  if (tenantRedirect) {
    return NextResponse.redirect(tenantRedirect);
  }

  if (tenant.isTenant && isTenantAppRoute(pathname) && !isPublicRoute(pathname)) {
    if (!hasSessionCookie(request)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  if (isPlatformHost(host)) {
    if (isPublicRoute(pathname)) {
      return NextResponse.next();
    }

    if (!hasSessionCookie(request)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
