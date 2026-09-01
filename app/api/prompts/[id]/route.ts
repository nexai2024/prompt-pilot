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
import {
  ensureSystemLanes,
  saveWorkingCopy,
  serializeLanes,
  type PromptVariableInput,
} from '@/lib/prompt-versions';
import { encodeFixtures, encodeTags, parseFixtures, parseTags } from '@/lib/prompt-meta';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const user = await requireSession(cookieHeader);

    const prompt = await findByPublicId('prompts', cookieHeader, id);
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    const lanes = await ensureSystemLanes(cookieHeader, user.id, prompt);

    return NextResponse.json({
      prompt: toPublicRecord(prompt),
      versioning: serializeLanes(lanes),
    });
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
    const user = await requireSession(cookieHeader);

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
    if (body.tags !== undefined) updateData.tags = encodeTags(parseTags(body.tags));
    if (body.is_starred !== undefined) updateData.is_starred = boolToInt(Boolean(body.is_starred));
    if (body.test_fixtures !== undefined) {
      updateData.test_fixtures = encodeFixtures(parseFixtures(body.test_fixtures));
    }

    const prompt = await ncbUpdate(
      'prompts',
      cookieHeader,
      existingPrompt.id,
      updateData
    );

    const touchesWorkingCopy =
      body.content !== undefined ||
      body.model !== undefined ||
      body.temperature !== undefined ||
      body.max_tokens !== undefined ||
      body.response_format !== undefined ||
      Array.isArray(body.variables);

    if (!touchesWorkingCopy) {
      return NextResponse.json({
        prompt: toPublicRecord({ ...existingPrompt, ...prompt }),
      });
    }

    const content = String(
      body.content !== undefined ? body.content : existingPrompt.content || ''
    );
    const model = String(
      body.model !== undefined ? body.model : existingPrompt.model || 'gpt-4'
    );
    const temperature = Number(
      body.temperature !== undefined
        ? body.temperature
        : existingPrompt.temperature ?? 0.7
    );
    const maxTokens = Number(
      body.max_tokens !== undefined
        ? body.max_tokens
        : existingPrompt.max_tokens ?? 150
    );
    const responseFormat = String(
      body.response_format !== undefined
        ? body.response_format
        : existingPrompt.response_format || 'text'
    );

    const versioning = await saveWorkingCopy(
      cookieHeader,
      user.id,
      { ...existingPrompt, ...prompt, supabase_id: existingPrompt.supabase_id },
      {
      content,
      model,
      temperature,
      max_tokens: maxTokens,
      response_format: responseFormat,
      variables: Array.isArray(body.variables)
        ? (body.variables as PromptVariableInput[])
        : undefined,
    });

    return NextResponse.json({
      prompt: toPublicRecord(prompt),
      versioning: {
        snapshotCreated: versioning.snapshotCreated,
        ...serializeLanes(versioning.lanes),
      },
    });
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
