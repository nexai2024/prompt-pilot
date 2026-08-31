import { NextRequest, NextResponse } from 'next/server';
import {
  ensureDefaultOrganization,
  ensureOrganizationVanitySubdomain,
  getOrganizationByPublicId,
  requireSession,
  toPublicId,
} from '@/lib/ncb-server';
import {
  buildDnsInstructions,
  formatVerificationTxtValue,
  getTxtVerificationHost,
  getTxtVerificationRelativeHost,
  verifyCustomDomainDns,
} from '@/lib/dns-verification';
import {
  buildTenantAppOrigin,
} from '@/lib/tenant-routing';
import {
  buildVanityHost,
  getBaseDomain,
  getCnameTarget,
} from '@/lib/tenant-domains';
import { setTenantSubdomainCookie } from '@/lib/cookie-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const user = await requireSession(cookieHeader);
    const orgMember = await ensureDefaultOrganization(user, cookieHeader);
    const orgId = String(orgMember.organization_id || '');

    const org = await getOrganizationByPublicId(orgId, cookieHeader);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const vanitySubdomain = await ensureOrganizationVanitySubdomain(
      orgId,
      cookieHeader,
      String(org.slug || orgId)
    );

    const customDomain = org.custom_domain ? String(org.custom_domain) : null;
    const customDomainVerified =
      org.custom_domain_verified === 1 || org.custom_domain_verified === true;
    const verificationToken = org.custom_domain_verification_token
      ? String(org.custom_domain_verification_token)
      : null;

    const protocol =
      req.headers.get('x-forwarded-proto') ||
      (process.env.NODE_ENV === 'development' ? 'http' : 'https');

    const tenantAppUrl = buildTenantAppOrigin(
      vanitySubdomain,
      'production',
      protocol
    );

    const response = NextResponse.json({
      organization: {
        id: toPublicId(org),
        name: org.name,
        vanitySubdomain,
        customDomain,
        customDomainVerified,
        verificationToken,
      },
      platform: {
        baseDomain: getBaseDomain(),
        cnameTarget: getCnameTarget(),
        appUrl: process.env.NEXT_PUBLIC_APP_URL || null,
      },
      tenant: {
        vanitySubdomain,
        tenantAppUrl,
        productionHost: buildVanityHost(vanitySubdomain, 'production'),
        stagingHost: buildVanityHost(vanitySubdomain, 'staging'),
        developmentHost: buildVanityHost(vanitySubdomain, 'development'),
      },
      dns: customDomain && verificationToken
        ? buildDnsInstructions(customDomain, verificationToken)
        : null,
      previews: {
        production: `${tenantAppUrl}`,
        staging: buildTenantAppOrigin(vanitySubdomain, 'staging', protocol),
        development: buildTenantAppOrigin(vanitySubdomain, 'development', protocol),
      },
    });

    const host =
      req.headers.get('x-forwarded-host') ||
      req.headers.get('host') ||
      'localhost';

    setTenantSubdomainCookie(response, vanitySubdomain, host);

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/** Live DNS status check without marking verified */
export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const user = await requireSession(cookieHeader);
    const orgMember = await ensureDefaultOrganization(user, cookieHeader);
    const orgId = String(orgMember.organization_id || '');
    const org = await getOrganizationByPublicId(orgId, cookieHeader);

    if (!org?.custom_domain || !org.custom_domain_verification_token) {
      return NextResponse.json(
        { error: 'Save a custom domain first' },
        { status: 400 }
      );
    }

    const domain = String(org.custom_domain);
    const token = String(org.custom_domain_verification_token);
    const result = await verifyCustomDomainDns({
      domain,
      verificationToken: token,
      cnameTarget: getCnameTarget(),
    });

    return NextResponse.json({
      ...result,
      dns: buildDnsInstructions(domain, token),
      instructions: {
        cnameSummary: `CNAME ${domain} → ${getCnameTarget()}`,
        txtSummary: `TXT ${getTxtVerificationRelativeHost()} → ${formatVerificationTxtValue(token)}`,
        txtHost: getTxtVerificationHost(domain),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
