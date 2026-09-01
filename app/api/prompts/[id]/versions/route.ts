import { NextRequest, NextResponse } from 'next/server';
import {
  findByPublicId,
  requireSession,
  toPublicRecord,
  toPublicRecords,
} from '@/lib/ncb-server';
import {
  createManualSnapshot,
  ensureSystemLanes,
  listPromptVersions,
  saveWorkingCopy,
  serializeLanes,
  type PromptVariableInput,
} from '@/lib/prompt-versions';

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
    const versions = await listPromptVersions(cookieHeader, id);

    return NextResponse.json({
      ...serializeLanes(lanes),
      versions: toPublicRecords(versions),
    });
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

    const prompt = await findByPublicId('prompts', cookieHeader, id);
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    let body: {
      content?: string;
      model?: string;
      temperature?: number;
      max_tokens?: number;
      response_format?: string;
      variables?: PromptVariableInput[];
    } = {};
    try {
      body = (await req.json()) as typeof body;
    } catch {
      body = {};
    }

    if (typeof body.content === 'string' && body.content.trim()) {
      await saveWorkingCopy(cookieHeader, user.id, prompt, {
        content: body.content,
        model: String(body.model || prompt.model || 'gpt-4'),
        temperature: Number(body.temperature ?? prompt.temperature ?? 0.7),
        max_tokens: Number(body.max_tokens ?? prompt.max_tokens ?? 150),
        response_format: String(body.response_format || prompt.response_format || 'text'),
        variables: Array.isArray(body.variables) ? body.variables : undefined,
      });
    }

    const version = await createManualSnapshot(cookieHeader, user.id, prompt);
    const lanes = await ensureSystemLanes(cookieHeader, user.id, prompt);

    return NextResponse.json(
      {
        version: toPublicRecord(version),
        versioning: serializeLanes(lanes),
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
