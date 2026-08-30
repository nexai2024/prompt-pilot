import { NextRequest, NextResponse } from 'next/server';
import {
  ensureDefaultOrganization,
  ncbCreate,
  ncbRead,
  newSupabaseId,
  requireSession,
  toPublicRecords,
} from '@/lib/ncb-server';
import { generateApiKey } from '@/lib/api-key-auth';

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const user = await requireSession(cookieHeader);
    const orgMember = await ensureDefaultOrganization(user, cookieHeader);
    const orgId = String(orgMember.organization_id || '');

    const apiKeys = await ncbRead('api_keys', cookieHeader, {
      organization_id: orgId,
      sort: 'created_at',
      order: 'desc',
    });

    const publicApiKeys = toPublicRecords(apiKeys).map((key) => ({
      id: key.id,
      name: key.name,
      keyPrefix: key.key_prefix,
      permissions: key.permissions
        ? String(key.permissions).split(',').map((p) => p.trim()).filter(Boolean)
        : [],
      lastUsedAt: key.last_used_at,
      expiresAt: key.expires_at,
      isActive: key.is_active === 1 || key.is_active === true,
      createdAt: key.created_at,
    }));

    return NextResponse.json({ apiKeys: publicApiKeys });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const user = await requireSession(cookieHeader);
    const orgMember = await ensureDefaultOrganization(user, cookieHeader);
    const orgId = String(orgMember.organization_id || '');
    const body = await req.json();

    const name = String(body.name || 'Production API Key').trim();
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const { fullKey, prefix, hash } = generateApiKey();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await ncbCreate('api_keys', cookieHeader, {
      supabase_id: newSupabaseId(),
      organization_id: orgId,
      created_by: user.id,
      name,
      key_hash: hash,
      key_prefix: prefix,
      permissions: 'read,write',
      is_active: 1,
      created_at: now,
      user_id: user.id,
    });

    return NextResponse.json(
      {
        apiKey: fullKey,
        keyPrefix: prefix,
        message: 'Copy this key now. It will not be shown again.',
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
