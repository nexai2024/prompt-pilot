import { NextRequest, NextResponse } from 'next/server';
import {
  findByPublicId,
  ncbCreate,
  ncbRead,
  ncbUpdate,
  newSupabaseId,
  requireSession,
  toPublicRecord,
  toPublicRecords,
} from '@/lib/ncb-server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const cookieHeader = req.headers.get('cookie') || '';
    await requireSession(cookieHeader);

    const versions = await ncbRead('prompt_versions', cookieHeader, {
      prompt_id: id,
      sort: 'version_number',
      order: 'desc',
    });

    return NextResponse.json({ versions: toPublicRecords(versions) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const user = await requireSession(cookieHeader);
    const body = await req.json();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const existingVersions = await ncbRead('prompt_versions', cookieHeader, {
      prompt_id: id,
      sort: 'version_number',
      order: 'desc',
      limit: '1',
    });

    const nextVersionNumber =
      existingVersions.length > 0
        ? Number(existingVersions[0]?.version_number || 0) + 1
        : 1;

    const version = await ncbCreate('prompt_versions', cookieHeader, {
      supabase_id: newSupabaseId(),
      prompt_id: id,
      version_number: nextVersionNumber,
      content: body.content,
      model: body.model,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      created_by: user.id,
      created_at: now,
      user_id: user.id,
    });

    return NextResponse.json(
      { version: toPublicRecord(version) },
      { status: 201 }
    );
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

    const prompt = await findByPublicId('prompts', cookieHeader, id);
    if (!prompt?.id) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    const body = await req.json();
    const updatedPrompt = await ncbUpdate('prompts', cookieHeader, prompt.id, {
      content: body.content,
      model: body.model,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    });

    return NextResponse.json({ prompt: toPublicRecord(updatedPrompt) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
