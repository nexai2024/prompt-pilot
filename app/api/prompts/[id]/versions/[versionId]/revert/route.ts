import { NextRequest, NextResponse } from 'next/server';
import {
  findByPublicId,
  ncbUpdate,
  requireSession,
  toPublicRecord,
} from '@/lib/ncb-server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { id, versionId } = await params;

  try {
    const cookieHeader = req.headers.get('cookie') || '';
    await requireSession(cookieHeader);

    const prompt = await findByPublicId('prompts', cookieHeader, id);
    if (!prompt?.id) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    const version = await findByPublicId('prompt_versions', cookieHeader, versionId);
    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    const updatedPrompt = await ncbUpdate('prompts', cookieHeader, prompt.id, {
      content: version.content,
      model: version.model,
      temperature: version.temperature,
      max_tokens: version.max_tokens,
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    });

    return NextResponse.json({ prompt: toPublicRecord(updatedPrompt) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
