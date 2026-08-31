import type { NextResponse } from 'next/server';
import { getBaseDomain } from './tenant-domains';
import { TENANT_SUBDOMAIN_COOKIE } from './tenant-routing';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

export function normalizeHostname(host: string): string {
  return host.toLowerCase().split(':')[0];
}

/** Shared cookie domain for platform + tenant subdomains (not custom domains). */
export function getSharedCookieDomain(host: string): string | undefined {
  const hostname = normalizeHostname(host);
  if (LOCAL_HOSTS.has(hostname)) return undefined;

  const base = getBaseDomain().toLowerCase();
  if (hostname === base || hostname.endsWith(`.${base}`)) {
    return `.${base}`;
  }

  return undefined;
}

export function transformAuthSetCookie(cookie: string, host: string): string {
  const parts = cookie.split(';');
  let nameValue = parts[0]?.trim() ?? '';

  if (nameValue.startsWith('__Secure-better-auth.')) {
    nameValue = nameValue.replace('__Secure-', '');
  } else if (nameValue.startsWith('__Host-better-auth.')) {
    nameValue = nameValue.replace('__Host-', '');
  }

  const otherAttributes = parts
    .slice(1)
    .map((attr) => attr.trim())
    .filter((attr) => {
      const lower = attr.toLowerCase();
      return (
        !lower.startsWith('domain=') &&
        !lower.startsWith('secure') &&
        !lower.startsWith('samesite=')
      );
    });

  otherAttributes.push('SameSite=Lax');

  const sharedDomain = getSharedCookieDomain(host);
  if (sharedDomain && process.env.NODE_ENV === 'production') {
    otherAttributes.push(`Domain=${sharedDomain}`, 'Secure');
  }

  return [nameValue, ...otherAttributes].join('; ');
}

export function setTenantSubdomainCookie(
  response: NextResponse,
  vanitySubdomain: string,
  host: string
): void {
  response.cookies.set(TENANT_SUBDOMAIN_COOKIE, vanitySubdomain, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    domain: getSharedCookieDomain(host),
  });
}
