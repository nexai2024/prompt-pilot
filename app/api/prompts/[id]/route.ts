import { NextRequest, NextResponse } from 'next/server';
import {
  boolToInt,
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

    const prompt = await findByPublicId('prompts', cookieHeader, id);
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    return NextResponse.json({ prompt: toPublicRecord(prompt) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    console.error('Error in GET /api/prompts/[id]:', error);
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

    const existingPrompt = await findByPublicId('prompts', cookieHeader, id);
    if (!existingPrompt?.id) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.model !== undefined) updateData.model = body.model;
    if (body.temperature !== undefined) updateData.temperature = body.temperature;
    if (body.max_tokens !== undefined) updateData.max_tokens = body.max_tokens;
    if (body.response_format !== undefined) updateData.response_format = body.response_format;
    if (body.streaming !== undefined) updateData.streaming = boolToInt(body.streaming);
    if (body.content_filtering !== undefined) {
      updateData.content_filtering = boolToInt(body.content_filtering);
    }
    if (body.caching !== undefined) updateData.caching = boolToInt(body.caching);
    if (body.status !== undefined) updateData.status = body.status;

    const prompt = await ncbUpdate(
      'prompts',
      cookieHeader,
      existingPrompt.id,
      updateData
    );

    return NextResponse.json({ prompt: toPublicRecord(prompt) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    console.error('Error in PUT /api/prompts/[id]:', error);
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

    const ncbId = await resolveNcbId('prompts', cookieHeader, id);
    if (!ncbId) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    await ncbDelete('prompts', cookieHeader, ncbId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    console.error('Error in DELETE /api/prompts/[id]:', error);
    return NextResponse.json({ error: message }, { status });
  }
}
