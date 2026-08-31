import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationByCustomDomain } from '@/lib/ncb-server';
import { buildTenantAppOrigin, isPlatformHost } from '@/lib/tenant-routing';
import { parseTenantHost } from '@/lib/tenant-domains';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const host =
      req.nextUrl.searchParams.get('host') ||
      req.headers.get('x-forwarded-host') ||
      req.headers.get('host') ||
      '';

    const hostname = host.toLowerCase().split(':')[0];
    if (!hostname) {
      return NextResponse.json({ error: 'Host is required' }, { status: 400 });
    }

    if (isPlatformHost(hostname)) {
      return NextResponse.json({ error: 'Platform host' }, { status: 400 });
    }

    const parsed = parseTenantHost(hostname);
    if (!parsed) {
      return NextResponse.json({ error: 'Unknown host' }, { status: 404 });
    }

    const protocol =
      req.headers.get('x-forwarded-proto') ||
      (process.env.NODE_ENV === 'development' ? 'http' : 'https');

    if (parsed.vanitySubdomain) {
      return NextResponse.json({
        host: hostname,
        vanitySubdomain: parsed.vanitySubdomain,
        environment: parsed.environment,
        tenantAppUrl: buildTenantAppOrigin(
          parsed.vanitySubdomain,
          parsed.environment,
          protocol
        ),
      });
    }

    if (parsed.customDomain) {
      let org;
      try {
        org = await getOrganizationByCustomDomain(parsed.customDomain);
      } catch (error) {
        console.error('resolve-host custom domain lookup failed:', error);
        return NextResponse.json(
          { error: 'Host lookup temporarily unavailable' },
          { status: 503 }
        );
      }

      if (!org) {
        return NextResponse.json({ error: 'Unknown host' }, { status: 404 });
      }

      const vanitySubdomain = org.vanity_subdomain
        ? String(org.vanity_subdomain)
        : null;
      if (!vanitySubdomain) {
        return NextResponse.json(
          { error: 'Tenant workspace not configured' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        host: hostname,
        customDomain: parsed.customDomain,
        customDomainVerified:
          org.custom_domain_verified === 1 || org.custom_domain_verified === true,
        vanitySubdomain,
        environment: 'production',
        tenantAppUrl: buildTenantAppOrigin(vanitySubdomain, 'production', protocol),
      });
    }

    return NextResponse.json({ error: 'Platform host' }, { status: 400 });
  } catch (error) {
    console.error('resolve-host error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
