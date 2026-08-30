import { NextRequest, NextResponse } from 'next/server';
import {
  findByPublicId,
  ncbDelete,
  ncbUpdate,
  requireSession,
  resolveNcbId,
  toPublicRecord,
} from '@/lib/ncb-server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const cookieHeader = req.headers.get('cookie') || '';
    await requireSession(cookieHeader);

    const endpoint = await findByPublicId('api_endpoints', cookieHeader, id);
    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    return NextResponse.json({ endpoint: toPublicRecord(endpoint) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const cookieHeader = req.headers.get('cookie') || '';
    await requireSession(cookieHeader);

    const existing = await findByPublicId('api_endpoints', cookieHeader, id);
    if (!existing?.id) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.path !== undefined) updateData.path = body.path;
    if (body.method !== undefined) updateData.method = body.method;
    if (body.description !== undefined) {
      updateData.description = body.description || null;
    }
    if (body.prompt_id) {
      updateData.prompt_id = body.prompt_id;
    }
    if (body.authentication !== undefined) {
      updateData.authentication = body.authentication;
    }
    if (body.rate_limit !== undefined && Number.isFinite(body.rate_limit)) {
      updateData.rate_limit = body.rate_limit;
    }

    await ncbUpdate('api_endpoints', cookieHeader, existing.id, updateData);

    const endpoint = await findByPublicId('api_endpoints', cookieHeader, id);
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint updated but could not be retrieved' },
        { status: 500 }
      );
    }

    return NextResponse.json({ endpoint: toPublicRecord(endpoint) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    console.error('Error in PUT /api/endpoints/[id]:', error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const cookieHeader = req.headers.get('cookie') || '';
    await requireSession(cookieHeader);

    const ncbId = await resolveNcbId('api_endpoints', cookieHeader, id);
    if (!ncbId) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    await ncbDelete('api_endpoints', cookieHeader, ncbId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
