export type DeployEnvironment = 'production' | 'staging' | 'development';

export const DEPLOY_ENVIRONMENTS: DeployEnvironment[] = [
  'production',
  'staging',
  'development',
];

export const RESERVED_SUBDOMAINS = new Set([
  'www',
  'api',
  'app',
  'staging',
  'dev',
  'development',
  'admin',
  'mail',
  'ftp',
  'cdn',
  'static',
  'status',
  'support',
  'billing',
]);

export function getBaseDomain(): string {
  return process.env.PROMPT_PILOT_BASE_DOMAIN || 'api.promptpilot.com';
}

export function getCnameTarget(): string {
  return process.env.PROMPT_PILOT_CNAME_TARGET || `cname.${getBaseDomain()}`;
}

export function normalizeSubdomain(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}

export function validateVanitySubdomain(subdomain: string): string | null {
  const normalized = normalizeSubdomain(subdomain);
  if (normalized.length < 3) {
    return 'Subdomain must be at least 3 characters';
  }
  if (RESERVED_SUBDOMAINS.has(normalized)) {
    return 'This subdomain is reserved';
  }
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(normalized)) {
    return 'Use lowercase letters, numbers, and hyphens only';
  }
  return null;
}

export function validateCustomDomain(domain: string): string | null {
  const normalized = domain
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');

  if (!normalized) return 'Domain is required';
  if (normalized.includes(' ')) return 'Invalid domain';
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(normalized)) {
    return 'Enter a valid domain (e.g. api.yourcompany.com)';
  }
  return null;
}

export function buildVanityHost(
  vanitySubdomain: string,
  environment: DeployEnvironment
): string {
  const base = getBaseDomain();
  if (environment === 'staging') {
    return `${vanitySubdomain}.staging.${base}`;
  }
  if (environment === 'development') {
    return `${vanitySubdomain}.dev.${base}`;
  }
  return `${vanitySubdomain}.${base}`;
}

export function normalizePath(path: string): string {
  if (!path) return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

export function buildDeploymentUrl(options: {
  path: string;
  environment: DeployEnvironment;
  vanitySubdomain: string;
  customDomain?: string | null;
  useCustomDomain?: boolean;
}): string {
  const normalizedPath = normalizePath(options.path);

  if (options.useCustomDomain && options.customDomain) {
    const domain = options.customDomain
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');
    return `https://${domain}${normalizedPath}`;
  }

  const host = buildVanityHost(options.vanitySubdomain, options.environment);
  return `https://${host}${normalizedPath}`;
}

export interface ParsedTenantHost {
  vanitySubdomain?: string;
  customDomain?: string;
  environment: DeployEnvironment;
}

export function parseTenantHost(host: string): ParsedTenantHost | null {
  const hostname = host.toLowerCase().split(':')[0];
  if (!hostname) return null;

  const base = getBaseDomain();

  const stagingSuffix = `.staging.${base}`;
  if (hostname.endsWith(stagingSuffix)) {
    const sub = hostname.slice(0, -stagingSuffix.length);
    if (sub && !sub.includes('.')) {
      return { vanitySubdomain: sub, environment: 'staging' };
    }
  }

  const devSuffix = `.dev.${base}`;
  if (hostname.endsWith(devSuffix)) {
    const sub = hostname.slice(0, -devSuffix.length);
    if (sub && !sub.includes('.')) {
      return { vanitySubdomain: sub, environment: 'development' };
    }
  }

  const prodSuffix = `.${base}`;
  if (hostname.endsWith(prodSuffix) && hostname !== base) {
    const sub = hostname.slice(0, -prodSuffix.length);
    if (sub && !sub.includes('.')) {
      return { vanitySubdomain: sub, environment: 'production' };
    }
  }

  if (hostname === base) {
    return { environment: 'production' };
  }

  return { customDomain: hostname, environment: 'production' };
}

export function generateVanitySubdomain(seed: string): string {
  let candidate = normalizeSubdomain(
    seed.replace(/^personal-/, '').replace(/-\d+$/, '')
  );

  if (candidate.length < 3 || RESERVED_SUBDOMAINS.has(candidate)) {
    candidate = `org-${seed.replace(/[^a-z0-9]/gi, '').slice(0, 8).toLowerCase()}`;
  }

  if (candidate.length < 3) {
    candidate = `org-${Date.now().toString(36).slice(-6)}`;
  }

  return candidate.slice(0, 63);
}

export function isDeployEnvironment(value: string): value is DeployEnvironment {
  return DEPLOY_ENVIRONMENTS.includes(value as DeployEnvironment);
}
