import { NextRequest, NextResponse } from 'next/server';
import { findByPublicId, requireSession } from '@/lib/ncb-server';
import { validateChangelog } from '@/lib/changelog';
import { promoteDevToProd, serializeLanes } from '@/lib/prompt-versions';

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

    const body = (await req.json().catch(() => ({}))) as { changelog?: string };
    const changelog = validateChangelog(body.changelog);

    const lanes = await promoteDevToProd(cookieHeader, user.id, prompt, changelog);
    return NextResponse.json({ versioning: serializeLanes(lanes) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status =
      message === 'Unauthorized'
        ? 401
        : message.includes('changelog') || message.includes('empty')
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
