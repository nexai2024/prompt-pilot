import { NextRequest, NextResponse } from 'next/server';
import {
  ensureDefaultOrganization,
  findByPublicId,
  requireSession,
} from '@/lib/ncb-server';
import { listPromptScores } from '@/lib/prompt-score-storage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    await requireSession(cookieHeader);
    const { id } = await params;

    const prompt = await findByPublicId('prompts', cookieHeader, id);
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    const limit = req.nextUrl.searchParams.get('limit') || '30';
    const scores = await listPromptScores(cookieHeader, id, Number(limit));

    return NextResponse.json({ scores });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
