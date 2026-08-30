import { promises as dns } from 'dns';
import { getCnameTarget } from './tenant-domains';

export interface DnsVerificationResult {
  verified: boolean;
  method?: 'txt' | 'cname';
  error?: string;
  details?: {
    txtHost?: string;
    cnameTarget?: string;
  };
}

function normalizeHostname(value: string): string {
  return value.toLowerCase().replace(/\.$/, '');
}

export function getTxtVerificationHost(domain: string): string {
  return `_promptpilot.${domain}`;
}

export async function verifyTxtRecord(
  host: string,
  expectedToken: string
): Promise<boolean> {
  try {
    const records = await dns.resolveTxt(host);
    return records.some((parts) => parts.join('').includes(expectedToken));
  } catch {
    return false;
  }
}

export async function verifyCnameRecord(
  domain: string,
  expectedTarget: string
): Promise<boolean> {
  const normalizedExpected = normalizeHostname(expectedTarget);

  try {
    const cnames = await dns.resolveCname(domain);
    return cnames.some(
      (record) => normalizeHostname(record) === normalizedExpected
    );
  } catch {
    return false;
  }
}

export async function verifyCustomDomainDns(options: {
  domain: string;
  verificationToken: string;
  cnameTarget?: string;
}): Promise<DnsVerificationResult> {
  const domain = options.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const cnameTarget = options.cnameTarget || getCnameTarget();
  const txtHost = getTxtVerificationHost(domain);

  if (await verifyTxtRecord(txtHost, options.verificationToken)) {
    return {
      verified: true,
      method: 'txt',
      details: { txtHost, cnameTarget },
    };
  }

  if (await verifyCnameRecord(domain, cnameTarget)) {
    return {
      verified: true,
      method: 'cname',
      details: { txtHost, cnameTarget },
    };
  }

  return {
    verified: false,
    error:
      'DNS records not found yet. Add the TXT or CNAME record below, wait for propagation, then try again.',
    details: { txtHost, cnameTarget },
  };
}
