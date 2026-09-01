import { NextRequest, NextResponse } from 'next/server';
import {
  boolToInt,
  getOrganizationMember,
  ncbCreate,
  ncbRead,
  ncbUpdate,
  newSupabaseId,
  requireSession,
  toPublicRecord,
  toPublicRecords,
} from '@/lib/ncb-server';
import { parseApiKeyPermissions } from '@/lib/api-key-utils';
import type { NcbRecord } from '@/lib/ncb-server';

function asBool(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}

function toPublicProfile(record: NcbRecord) {
  return {
    ...toPublicRecord(record),
    email_notifications: asBool(record.email_notifications),
    marketing_notifications: asBool(record.marketing_notifications),
  };
}

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

    const profile = profiles[0] ? toPublicProfile(profiles[0]) : null;

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

export async function PUT(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const user = await requireSession(cookieHeader);
    const body = (await req.json()) as {
      first_name?: string;
      last_name?: string;
      email?: string;
      company?: string;
      bio?: string;
      timezone?: string;
      email_notifications?: boolean;
      marketing_notifications?: boolean;
      avatar_url?: string | null;
    };

    const existing = await ncbRead('profiles', cookieHeader, { user_id: user.id });
    const current = existing[0];

    const firstName =
      body.first_name !== undefined
        ? String(body.first_name || '').trim()
        : String(current?.first_name || '');
    const lastName =
      body.last_name !== undefined
        ? String(body.last_name || '').trim()
        : String(current?.last_name || '');
    const email = String(body.email || current?.email || user.email || '').trim();
    const company =
      body.company !== undefined
        ? String(body.company || '').trim()
        : String(current?.company || '');
    const bio =
      body.bio !== undefined ? String(body.bio || '').trim() : String(current?.bio || '');
    const timezone = String(
      body.timezone || current?.timezone || 'utc+0'
    ).trim();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }

    let avatarUrl =
      body.avatar_url !== undefined ? body.avatar_url : current?.avatar_url;
    if (typeof avatarUrl === 'string') {
      if (avatarUrl && !avatarUrl.startsWith('data:image/') && !avatarUrl.startsWith('http')) {
        return NextResponse.json({ error: 'Avatar must be an image' }, { status: 400 });
      }
      if (avatarUrl.length > 180000) {
        return NextResponse.json(
          { error: 'Avatar is too large. Use a smaller image.' },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const payload: Record<string, unknown> = {
      first_name: firstName || null,
      last_name: lastName || null,
      email,
      company: company || null,
      bio: bio || null,
      timezone,
      avatar_url: avatarUrl || null,
      email_notifications: boolToInt(
        body.email_notifications !== undefined
          ? Boolean(body.email_notifications)
          : current?.email_notifications === 1 || current?.email_notifications === true
      ),
      marketing_notifications: boolToInt(
        body.marketing_notifications !== undefined
          ? Boolean(body.marketing_notifications)
          : current?.marketing_notifications === 1 ||
              current?.marketing_notifications === true
      ),
      updated_at: now,
      user_id: user.id,
    };

    const saved = current?.id
      ? await ncbUpdate('profiles', cookieHeader, Number(current.id), payload)
      : await ncbCreate('profiles', cookieHeader, {
          supabase_id: newSupabaseId(),
          created_at: now,
          ...payload,
        });

    return NextResponse.json({
      profile: toPublicProfile({ ...current, ...saved, ...payload }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
