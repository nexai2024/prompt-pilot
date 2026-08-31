import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { buildDnsInstructions, getTxtVerificationHost } from '@/lib/dns-verification';
import {
  ensureDefaultOrganization,
  findByPublicId,
  getOrganizationByPublicId,
  ncbRead,
  ncbUpdate,
  requireSession,
  toPublicId,
} from '@/lib/ncb-server';
import {
  buildVanityHost,
  getBaseDomain,
  getCnameTarget,
  normalizeSubdomain,
  validateCustomDomain,
  validateVanitySubdomain,
} from '@/lib/tenant-domains';
import { setTenantSubdomainCookie } from '@/lib/cookie-utils';

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

    const vanitySubdomain = org.vanity_subdomain
      ? String(org.vanity_subdomain)
      : null;
    const customDomain = org.custom_domain ? String(org.custom_domain) : null;
    const customDomainVerified =
      org.custom_domain_verified === 1 || org.custom_domain_verified === true;
    const verificationToken = org.custom_domain_verification_token
      ? String(org.custom_domain_verification_token)
      : null;

    const dns =
      customDomain && verificationToken
        ? buildDnsInstructions(customDomain, verificationToken, getCnameTarget())
        : null;

    const response = NextResponse.json({
      organization: {
        id: toPublicId(org),
        name: org.name,
        slug: org.slug,
        vanitySubdomain,
        customDomain,
        customDomainVerified,
        verificationToken,
        txtVerificationHost: customDomain
          ? getTxtVerificationHost(customDomain)
          : null,
      },
      baseDomain: getBaseDomain(),
      cnameTarget: getCnameTarget(),
      dns,
      previews: vanitySubdomain
        ? {
            production: `https://${buildVanityHost(vanitySubdomain, 'production')}`,
            staging: `https://${buildVanityHost(vanitySubdomain, 'staging')}`,
            development: `https://${buildVanityHost(vanitySubdomain, 'development')}`,
          }
        : null,
    });

    if (vanitySubdomain) {
      const host =
        req.headers.get('x-forwarded-host') ||
        req.headers.get('host') ||
        'localhost';
      setTenantSubdomainCookie(response, vanitySubdomain, host);
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const user = await requireSession(cookieHeader);
    const orgMember = await ensureDefaultOrganization(user, cookieHeader);
    const orgId = String(orgMember.organization_id || '');
    const body = await req.json();

    const org = await getOrganizationByPublicId(orgId, cookieHeader);
    if (!org?.id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };

    if (body.vanity_subdomain !== undefined) {
      const normalized = normalizeSubdomain(String(body.vanity_subdomain));
      const validationError = validateVanitySubdomain(normalized);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const taken = await ncbRead('organizations', cookieHeader, {
        vanity_subdomain: normalized,
      });
      const conflict = taken.find(
        (record) => toPublicId(record) !== orgId
      );
      if (conflict) {
        return NextResponse.json(
          { error: 'This subdomain is already taken' },
          { status: 409 }
        );
      }

      updates.vanity_subdomain = normalized;
    }

    if (body.custom_domain !== undefined) {
      const raw = String(body.custom_domain || '').trim();
      if (!raw) {
        updates.custom_domain = null;
        updates.custom_domain_verified = 0;
        updates.custom_domain_verification_token = null;
      } else {
        const validationError = validateCustomDomain(raw);
        if (validationError) {
          return NextResponse.json({ error: validationError }, { status: 400 });
        }

        const normalized = raw
          .toLowerCase()
          .replace(/^https?:\/\//, '')
          .replace(/\/.*$/, '');

        const taken = await ncbRead('organizations', cookieHeader, {
          custom_domain: normalized,
        });
        const conflict = taken.find(
          (record) => toPublicId(record) !== orgId
        );
        if (conflict) {
          return NextResponse.json(
            { error: 'This custom domain is already registered' },
            { status: 409 }
          );
        }

        updates.custom_domain = normalized;
        updates.custom_domain_verified = 0;
        updates.custom_domain_verification_token = `pp-verify-${randomUUID()}`;
      }
    }

    if (body.verify_custom_domain === true) {
      return NextResponse.json(
        {
          error:
            'Manual verification is disabled. Use POST /api/organizations/domains/verify after configuring DNS.',
        },
        { status: 400 }
      );
    }

    await ncbUpdate('organizations', cookieHeader, org.id, updates);

    const updated = await findByPublicId('organizations', cookieHeader, orgId);
    if (!updated) {
      return NextResponse.json(
        { error: 'Organization updated but could not be retrieved' },
        { status: 500 }
      );
    }

    const vanitySubdomain = updated.vanity_subdomain
      ? String(updated.vanity_subdomain)
      : null;
    const customDomainUpdated = updated.custom_domain
      ? String(updated.custom_domain)
      : null;
    const tokenUpdated = updated.custom_domain_verification_token
      ? String(updated.custom_domain_verification_token)
      : null;

    const response = NextResponse.json({
      organization: {
        id: toPublicId(updated),
        name: updated.name,
        slug: updated.slug,
        vanitySubdomain,
        customDomain: customDomainUpdated,
        customDomainVerified:
          updated.custom_domain_verified === 1 ||
          updated.custom_domain_verified === true,
        verificationToken: tokenUpdated,
        txtVerificationHost: customDomainUpdated
          ? getTxtVerificationHost(customDomainUpdated)
          : null,
      },
      dns:
        customDomainUpdated && tokenUpdated
          ? buildDnsInstructions(customDomainUpdated, tokenUpdated, getCnameTarget())
          : null,
      previews: vanitySubdomain
        ? {
            production: `https://${buildVanityHost(vanitySubdomain, 'production')}`,
            staging: `https://${buildVanityHost(vanitySubdomain, 'staging')}`,
            development: `https://${buildVanityHost(vanitySubdomain, 'development')}`,
          }
        : null,
    });

    if (vanitySubdomain) {
      const host =
        req.headers.get('x-forwarded-host') ||
        req.headers.get('host') ||
        'localhost';
      setTenantSubdomainCookie(response, vanitySubdomain, host);
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
