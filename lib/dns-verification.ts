import { promises as dns } from 'dns';
import { getCnameTarget } from './tenant-domains';

export interface DnsVerificationResult {
  verified: boolean;
  method?: 'txt' | 'cname';
  error?: string;
  details?: {
    txtHost?: string;
    txtValue?: string;
    cnameHost?: string;
    cnameTarget?: string;
  };
}

function normalizeHostname(value: string): string {
  return value.toLowerCase().replace(/\.$/, '');
}

/** Industry-standard challenge host (relative name: _promptpilot-challenge) */
export function getTxtVerificationHost(domain: string): string {
  const normalized = domain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
  return `_promptpilot-challenge.${normalized}`;
}

/** Relative DNS label shown in provider UI (domain column is the custom domain) */
export function getTxtVerificationRelativeHost(): string {
  return '_promptpilot-challenge';
}

/** Standard TXT value format (Google/Vercel-style key=value) */
export function formatVerificationTxtValue(token: string): string {
  return `promptpilot-site-verification=${token}`;
}

export function parseVerificationTokenFromTxt(record: string): string | null {
  const trimmed = record.trim();
  const prefix = 'promptpilot-site-verification=';
  if (trimmed.startsWith(prefix)) {
    return trimmed.slice(prefix.length);
  }
  // Legacy tokens stored as raw pp-verify-* values
  if (trimmed.startsWith('pp-verify-')) {
    return trimmed;
  }
  return null;
}

export async function verifyTxtRecord(
  host: string,
  expectedToken: string
): Promise<boolean> {
  const expectedValue = formatVerificationTxtValue(expectedToken);

  try {
    const records = await dns.resolveTxt(host);
    return records.some((parts) => {
      const joined = parts.join('');
      const parsed = parseVerificationTokenFromTxt(joined);
      if (parsed === expectedToken) return true;
      // Accept legacy format where raw token was pasted
      return joined.includes(expectedToken) || joined === expectedToken;
    });
  } catch {
    return false;
  }
}

function cnameMatchesTarget(record: string, expectedTarget: string): boolean {
  const normalizedRecord = normalizeHostname(record);
  const normalizedExpected = normalizeHostname(expectedTarget);
  return (
    normalizedRecord === normalizedExpected ||
    normalizedRecord.endsWith(`.${normalizedExpected}`)
  );
}

export async function verifyCnameRecord(
  domain: string,
  expectedTarget: string
): Promise<boolean> {
  try {
    const cnames = await dns.resolveCname(domain);
    if (cnames.some((record) => cnameMatchesTarget(record, expectedTarget))) {
      return true;
    }
  } catch {
    // fall through — try resolveAny / lookup
  }

  try {
    const lookedUp = await dns.lookup(domain, { verbatim: true });
    const cnameLookup = lookedUp as { cname?: string };
    if (cnameLookup.cname && cnameMatchesTarget(cnameLookup.cname, expectedTarget)) {
      return true;
    }
  } catch {
    // ignore
  }

  return false;
}

export interface DnsInstructions {
  domain: string;
  cname: {
    type: 'CNAME';
    host: string;
    hostRelative: string;
    target: string;
    required: true;
  };
  txt: {
    type: 'TXT';
    host: string;
    hostRelative: string;
    value: string;
    required: false;
    purpose: 'ownership';
  };
}

export function buildDnsInstructions(
  domain: string,
  verificationToken: string,
  cnameTarget?: string
): DnsInstructions {
  const normalized = domain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');

  const target = cnameTarget || getCnameTarget();

  return {
    domain: normalized,
    cname: {
      type: 'CNAME',
      host: normalized,
      hostRelative: normalized.includes('.')
        ? normalized.split('.')[0]
        : '@',
      target,
      required: true,
    },
    txt: {
      type: 'TXT',
      host: getTxtVerificationHost(normalized),
      hostRelative: getTxtVerificationRelativeHost(),
      value: formatVerificationTxtValue(verificationToken),
      required: false,
      purpose: 'ownership',
    },
  };
}

export async function verifyCustomDomainDns(options: {
  domain: string;
  verificationToken: string;
  cnameTarget?: string;
}): Promise<DnsVerificationResult> {
  const domain = options.domain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
  const cnameTarget = options.cnameTarget || getCnameTarget();
  const txtHost = getTxtVerificationHost(domain);
  const txtValue = formatVerificationTxtValue(options.verificationToken);

  const txtOk = await verifyTxtRecord(txtHost, options.verificationToken);
  if (txtOk) {
    return {
      verified: true,
      method: 'txt',
      details: { txtHost, txtValue, cnameHost: domain, cnameTarget },
    };
  }

  const cnameOk = await verifyCnameRecord(domain, cnameTarget);
  if (cnameOk) {
    return {
      verified: true,
      method: 'cname',
      details: { txtHost, txtValue, cnameHost: domain, cnameTarget },
    };
  }

  return {
    verified: false,
    error:
      'DNS records not found yet. Add the CNAME (required for traffic) and/or TXT verification record, wait for propagation (up to 48h), then verify again.',
    details: { txtHost, txtValue, cnameHost: domain, cnameTarget },
  };
}
