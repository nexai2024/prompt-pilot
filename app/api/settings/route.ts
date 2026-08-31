import { NextRequest, NextResponse } from 'next/server';
import {
  getOrganizationMember,
  ncbRead,
  requireSession,
  toPublicRecord,
  toPublicRecords,
} from '@/lib/ncb-server';
import { parseApiKeyPermissions } from '@/lib/api-key-utils';

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const user = await requireSession(cookieHeader);
    const orgMember = await getOrganizationMember(user.id, cookieHeader);

    const [profiles, orgMemberResolved] = await Promise.all([
      ncbRead('profiles', cookieHeader, { user_id: user.id }),
      orgMember ?? Promise.resolve(null),
    ]);

    let apiKeys: Array<Record<string, unknown>> = [];
    if (orgMemberResolved?.organization_id) {
      apiKeys = await ncbRead('api_keys', cookieHeader, {
        organization_id: String(orgMemberResolved.organization_id),
        sort: 'created_at',
        order: 'desc',
      });
    }

    const profile = profiles[0] ? toPublicRecord(profiles[0]) : null;

    let teamMembers: Array<Record<string, unknown>> = [];
    let subscription = null;
    let billingPlans: Array<Record<string, unknown>> = [];

    if (orgMemberResolved?.organization_id) {
      const orgId = String(orgMemberResolved.organization_id);

      const [members, subscriptions, plans] = await Promise.all([
        ncbRead('organization_members', cookieHeader, { organization_id: orgId }),
        ncbRead('subscriptions', cookieHeader, { organization_id: orgId }),
        ncbRead('billing_plans', cookieHeader),
      ]);

      const allProfiles = await ncbRead('profiles', cookieHeader);
      const profileByUserId = new Map(
        allProfiles.map((p) => [String(p.user_id), p])
      );

      teamMembers = members.map((member) => {
        const memberProfile = profileByUserId.get(String(member.user_id));
        return {
          id: member.supabase_id || String(member.id),
          role: member.role || 'member',
          userId: member.user_id,
          name: memberProfile
            ? [memberProfile.first_name, memberProfile.last_name].filter(Boolean).join(' ') ||
              memberProfile.email
            : user.email,
          email: memberProfile?.email || user.email,
          avatarUrl: memberProfile?.avatar_url || null,
        };
      });

      subscription = subscriptions[0] ? toPublicRecord(subscriptions[0]) : null;
      billingPlans = toPublicRecords(plans);
    }

    const publicApiKeys = toPublicRecords(apiKeys).map((key) => ({
      id: key.id,
      name: key.name,
      keyPrefix: key.key_prefix,
      permissions: parseApiKeyPermissions(key.permissions),
      lastUsedAt: key.last_used_at,
      expiresAt: key.expires_at,
      isActive: key.is_active === 1 || key.is_active === true,
      createdAt: key.created_at,
    }));

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      profile,
      apiKeys: publicApiKeys,
      teamMembers,
      subscription,
      billingPlans,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
