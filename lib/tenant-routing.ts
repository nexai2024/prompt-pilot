import {
  buildVanityHost,
  getBaseDomain,
  getCnameTarget,
  isPlatformHostname,
  parseTenantHost,
  type DeployEnvironment,
} from './tenant-domains';

export const TENANT_SUBDOMAIN_COOKIE = 'pp_vanity_subdomain';

/** App pages served on tenant hosts (not rewritten to the API gateway) */
export const TENANT_APP_ROUTES = new Set([
  '/',
  '/dashboard',
  '/prompt-studio',
  '/api-designer',
  '/deployments',
  '/analytics',
  '/settings',
  '/prompt-scorer',
  '/sign-in',
  '/sign-up',
  '/reset-password',
  '/auth/callback',
]);

/** Prefixes that always pass through on tenant hosts */
export const TENANT_PASS_THROUGH_PREFIXES = [
  '/api/',
  '/_next/',
  '/.well-known/',
];

export function getRequestHost(headers: Headers): string {
  return (
    headers.get('x-forwarded-host') ||
    headers.get('host') ||
    ''
  )
    .toLowerCase()
    .split(':')[0];
}

export function getBaseDomainFromEnv(): string {
  return getBaseDomain().toLowerCase();
}

export function getPlatformHosts(): string[] {
  const base = getBaseDomainFromEnv();
  const hosts = new Set<string>([
    base,
    `www.${base}`,
    `app.${base}`,
    'localhost',
    '127.0.0.1',
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      hosts.add(new URL(appUrl).hostname.toLowerCase());
    } catch {
      // ignore invalid URL
    }
  }

  return Array.from(hosts);
}

export function isPlatformHost(host: string): boolean {
  return isPlatformHostname(host);
}

export interface TenantHostInfo {
  isTenant: boolean;
  isVanity: boolean;
  isCustomDomain: boolean;
  vanitySubdomain?: string;
  customDomain?: string;
  environment: DeployEnvironment;
}

export function analyzeTenantHost(host: string): TenantHostInfo {
  const hostname = host.toLowerCase().split(':')[0];
  const parsed = parseTenantHost(hostname);

  if (!parsed) {
    return {
      isTenant: false,
      isVanity: false,
      isCustomDomain: false,
      environment: 'production',
    };
  }

  const isVanity = Boolean(parsed.vanitySubdomain);
  const isCustomDomain =
    Boolean(parsed.customDomain) && !isPlatformHost(hostname);
  const isTenant =
    isVanity ||
    isCustomDomain ||
    (parsed.environment !== 'production' && !isPlatformHost(hostname));

  return {
    isTenant: isTenant && !isPlatformHost(hostname),
    isVanity,
    isCustomDomain,
    vanitySubdomain: parsed.vanitySubdomain,
    customDomain: parsed.customDomain,
    environment: parsed.environment,
  };
}

export function isTenantAppRoute(pathname: string): boolean {
  if (TENANT_APP_ROUTES.has(pathname)) return true;
  // Allow nested app paths if added later (none today)
  return false;
}

export function shouldPassThroughOnTenantHost(pathname: string): boolean {
  if (isTenantAppRoute(pathname)) return true;
  return TENANT_PASS_THROUGH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** Rewrite tenant API paths to the internal gateway handler */
export function shouldRewriteToGateway(host: string, pathname: string): boolean {
  const tenant = analyzeTenantHost(host);
  if (!tenant.isTenant) return false;
  if (shouldPassThroughOnTenantHost(pathname)) return false;
  // Health probe at deployment root
  if (pathname === '/health' || pathname.endsWith('/health')) return true;
  return true;
}

export function gatewayRewriteUrl(requestUrl: URL, pathname: string): URL {
  const gatewayPath = pathname.startsWith('/')
    ? `/api/gateway${pathname}`
    : `/api/gateway/${pathname}`;
  const url = new URL(requestUrl);
  url.pathname = gatewayPath.replace(/\/+/g, '/');
  return url;
}

export function buildTenantAppOrigin(
  vanitySubdomain: string,
  environment: DeployEnvironment = 'production',
  protocol = 'https'
): string {
  const host = buildVanityHost(vanitySubdomain, environment);
  return `${protocol}://${host}`;
}

export function buildTenantRedirectUrl(
  vanitySubdomain: string,
  pathname: string,
  search = '',
  environment: DeployEnvironment = 'production'
): string {
  const origin = buildTenantAppOrigin(vanitySubdomain, environment);
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${origin}${path}${search}`;
}

export function getCnameTargetForDocs(): string {
  return getCnameTarget();
}
