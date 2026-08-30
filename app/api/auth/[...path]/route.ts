import { NextRequest, NextResponse } from 'next/server';
import {
  extractAuthCookies,
  NCB_CONFIG,
  transformSetCookieForLocalhost,
} from '@/lib/ncb-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxy(req, path.join('/'));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join('/');

  if (pathStr === 'sign-out') {
    return handleSignOut(req);
  }

  return proxy(req, pathStr, await req.text());
}

async function handleSignOut(req: NextRequest) {
  const response = new NextResponse(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

  try {
    const searchParams = new URLSearchParams();
    searchParams.set('Instance', NCB_CONFIG.instance);
    const url = `${NCB_CONFIG.authApiUrl}/sign-out?${searchParams.toString()}`;
    const origin = req.headers.get('origin') || req.nextUrl.origin;
    const authCookies = extractAuthCookies(req.headers.get('cookie') || '');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Database-Instance': NCB_CONFIG.instance,
        Cookie: authCookies,
        Origin: origin,
        Authorization: `Bearer ${NCB_CONFIG.secretKey}`,
      },
      body: '{}',
    });

    const cookies = res.headers.getSetCookie?.() || [];
    for (const cookie of cookies) {
      response.headers.append(
        'Set-Cookie',
        transformSetCookieForLocalhost(cookie)
      );
    }
  } catch {
    // ignore upstream sign-out errors
  }

  for (const cookieName of ['better-auth.session_token', 'better-auth.session_data']) {
    response.headers.append(
      'Set-Cookie',
      `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
    );
  }

  return response;
}

async function proxy(req: NextRequest, path: string, body?: string) {
  const searchParams = new URLSearchParams();
  searchParams.set('Instance', NCB_CONFIG.instance);
  const url = `${NCB_CONFIG.authApiUrl}/${path}?${searchParams.toString()}`;
  const origin = req.headers.get('origin') || req.nextUrl.origin;
  const authCookies = extractAuthCookies(req.headers.get('cookie') || '');

  const res = await fetch(url, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'X-Database-Instance': NCB_CONFIG.instance,
      Cookie: authCookies,
      Origin: origin,
      Authorization: `Bearer ${NCB_CONFIG.secretKey}`,
    },
    body: body || undefined,
  });

  const data = await res.text();
  const response = new NextResponse(data, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });

  const cookies = res.headers.getSetCookie?.() || [];
  for (const cookie of cookies) {
    response.headers.append(
      'Set-Cookie',
      transformSetCookieForLocalhost(cookie)
    );
  }

  return response;
}
