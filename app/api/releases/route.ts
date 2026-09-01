import { NextRequest, NextResponse } from 'next/server';
import {
  ensureDefaultOrganization,
  ncbRead,
  requireSession,
  toPublicId,
} from '@/lib/ncb-server';
import { parseLane } from '@/lib/prompt-versions';

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const user = await requireSession(cookieHeader);
    await ensureDefaultOrganization(user, cookieHeader);

    const [prompts, versions] = await Promise.all([
      ncbRead('prompts', cookieHeader, { sort: 'updated_at', order: 'desc' }),
      ncbRead('prompt_versions', cookieHeader),
    ]);

    const versionsByPrompt = new Map<string, typeof versions>();
    for (const version of versions) {
      const promptId = String(version.prompt_id || '');
      const list = versionsByPrompt.get(promptId) || [];
      list.push(version);
      versionsByPrompt.set(promptId, list);
    }

    const releases = prompts.flatMap((prompt) => {
      const promptId = toPublicId(prompt);
      const promptVersions = versionsByPrompt.get(promptId) || [];
      return promptVersions
        .filter((version) => {
          const lane = parseLane(version.lane);
          const changelog = String(version.changelog || '').trim();
          return changelog.length > 0 && (lane === 'prod' || lane === 'snapshot');
        })
        .map((version) => ({
          id: String(version.supabase_id || version.id),
          promptId,
          promptName: String(prompt.name || 'Untitled prompt'),
          versionNumber: Number(version.version_number || 0),
          lane: parseLane(version.lane),
          changelog: String(version.changelog || ''),
          createdAt: String(version.created_at || prompt.updated_at || ''),
        }));
    });

    releases.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ releases: releases.slice(0, 50) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
