import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { verifyCustomDomainDns, getTxtVerificationHost } from '@/lib/dns-verification';
import {
  ensureDefaultOrganization,
  findByPublicId,
  getOrganizationByPublicId,
  ncbUpdate,
  requireSession,
  toPublicId,
} from '@/lib/ncb-server';
import { getCnameTarget } from '@/lib/tenant-domains';

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const user = await requireSession(cookieHeader);
    const orgMember = await ensureDefaultOrganization(user, cookieHeader);
    const orgId = String(orgMember.organization_id || '');

    const org = await getOrganizationByPublicId(orgId, cookieHeader);
    if (!org?.id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const customDomain = org.custom_domain ? String(org.custom_domain) : '';
    if (!customDomain) {
      return NextResponse.json(
        { error: 'Save a custom domain before verifying DNS' },
        { status: 400 }
      );
    }

    let verificationToken = org.custom_domain_verification_token
      ? String(org.custom_domain_verification_token)
      : '';

    if (!verificationToken) {
      verificationToken = `pp-verify-${randomUUID()}`;
      await ncbUpdate('organizations', cookieHeader, org.id, {
        custom_domain_verification_token: verificationToken,
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }

    const cnameTarget = getCnameTarget();
    const result = await verifyCustomDomainDns({
      domain: customDomain,
      verificationToken,
      cnameTarget,
    });

    if (!result.verified) {
      return NextResponse.json(
        {
          verified: false,
          error: result.error,
          verification: {
            domain: customDomain,
            txtHost: getTxtVerificationHost(customDomain),
            txtValue: verificationToken,
            cnameTarget,
          },
        },
        { status: 422 }
      );
    }

    await ncbUpdate('organizations', cookieHeader, org.id, {
      custom_domain_verified: 1,
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    });

    const updated = await findByPublicId('organizations', cookieHeader, orgId);

    return NextResponse.json({
      verified: true,
      method: result.method,
      organization: {
        id: toPublicId(updated || org),
        customDomain,
        customDomainVerified: true,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
