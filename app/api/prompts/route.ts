import { NextRequest, NextResponse } from 'next/server';
import {
  boolToInt,
  ensureDefaultOrganization,
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

    const prompts = await ncbRead('prompts', cookieHeader, {
      sort: 'created_at',
      order: 'desc',
    });

    return NextResponse.json({ prompts: toPublicRecords(prompts) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    console.error('Error in GET /api/prompts:', error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const user = await requireSession(cookieHeader);
    const orgMember = await ensureDefaultOrganization(user, cookieHeader);

    const body = await req.json();
    const {
      name,
      description,
      content,
      model = 'gpt-4',
      temperature = 0.7,
      max_tokens = 150,
      response_format = 'text',
      streaming = false,
      content_filtering = true,
      caching = true,
      status = 'draft',
    } = body;

    if (!name || !content) {
      return NextResponse.json(
        { error: 'name and content are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const prompt = await ncbCreate('prompts', cookieHeader, {
      supabase_id: newSupabaseId(),
      organization_id: String(orgMember.organization_id || ''),
      created_by: user.id,
      name,
      description: description || null,
      content,
      model,
      temperature,
      max_tokens,
      response_format,
      streaming: boolToInt(streaming),
      content_filtering: boolToInt(content_filtering),
      caching: boolToInt(caching),
      status,
      created_at: now,
      updated_at: now,
      user_id: user.id,
    });

    return NextResponse.json({ prompt: toPublicRecord(prompt) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status =
      message === 'Unauthorized'
        ? 401
        : message.includes('organization')
          ? 404
          : 500;
    console.error('Error in POST /api/prompts:', error);
    return NextResponse.json({ error: message }, { status });
  }
}
