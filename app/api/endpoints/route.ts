import { NextRequest, NextResponse } from 'next/server';
import {
  ensureDefaultOrganization,
  findByPublicId,
  ncbCreate,
  ncbRead,
  newSupabaseId,
  requireSession,
  toPublicRecord,
  toPublicRecords,
} from '@/lib/ncb-server';

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    await requireSession(cookieHeader);

    const endpoints = await ncbRead('api_endpoints', cookieHeader, {
      sort: 'created_at',
      order: 'desc',
    });

    return NextResponse.json({ endpoints: toPublicRecords(endpoints) });
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
    const body = await req.json();

    if (!body.name || !body.path) {
      return NextResponse.json(
        { error: 'name and path are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const supabaseId = newSupabaseId();

    const createPayload: Record<string, unknown> = {
      supabase_id: supabaseId,
      organization_id: String(orgMember.organization_id || ''),
      created_by: user.id,
      name: body.name,
      path: body.path,
      method: body.method || 'POST',
      description: body.description || null,
      authentication: body.authentication || 'api-key',
      rate_limit: body.rate_limit ?? 100,
      cors_enabled: 1,
      request_validation: 1,
      request_logging: 1,
      created_at: now,
      updated_at: now,
      user_id: user.id,
    };

    if (body.prompt_id) {
      createPayload.prompt_id = body.prompt_id;
    }

    await ncbCreate('api_endpoints', cookieHeader, createPayload);

    const endpoint = await findByPublicId('api_endpoints', cookieHeader, supabaseId);
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint created but could not be retrieved' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { endpoint: toPublicRecord(endpoint) },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    console.error('Error in POST /api/endpoints:', error);
    return NextResponse.json({ error: message }, { status });
  }
}
