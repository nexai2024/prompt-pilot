import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log('[Middleware]', {
    pathname: req.nextUrl.pathname,
    hasSession: !!session,
    userId: session?.user?.id,
  });

  // Protected routes that require authentication
  const protectedPaths = [
    '/dashboard',
    '/prompt-studio',
    '/api-designer',
    '/deployments',
    '/analytics',
    '/settings'
  ];

  const isProtectedPath = protectedPaths.some(path =>
    req.nextUrl.pathname.startsWith(path)
  );

  // Redirect to sign-in if accessing protected route without session
  if (isProtectedPath && !session) {
    console.log('[Middleware] Redirecting to sign-in - no session found');
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/auth/sign-in';
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to dashboard if accessing auth pages with active session
  if (req.nextUrl.pathname.startsWith('/auth/') && session) {
    console.log('[Middleware] Redirecting to dashboard - already authenticated');
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  console.log('[Middleware] Allowing request to proceed');
  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/prompt-studio/:path*',
    '/api-designer/:path*',
    '/deployments/:path*',
    '/analytics/:path*',
    '/settings/:path*',
    '/auth/:path*'
  ]
};
