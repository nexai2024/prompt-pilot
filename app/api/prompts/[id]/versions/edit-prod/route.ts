import { NextRequest, NextResponse } from 'next/server';
import { findByPublicId, requireSession, toPublicRecord } from '@/lib/ncb-server';
import { editProduction, serializeLanes } from '@/lib/prompt-versions';

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

    const lanes = await editProduction(cookieHeader, user.id, prompt);
    return NextResponse.json({
      prompt: toPublicRecord({ ...prompt, ...lanes.dev }),
      versioning: serializeLanes(lanes),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status =
      message === 'Unauthorized'
        ? 401
        : message.includes('empty') || message.includes('Already')
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
