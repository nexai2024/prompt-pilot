import { NextRequest, NextResponse } from 'next/server';
import {
  ensureDefaultOrganization,
  ncbRead,
  requireSession,
  toPublicRecords,
} from '@/lib/ncb-server';
import { listOrganizationScores } from '@/lib/prompt-score-storage';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const user = await requireSession(cookieHeader);
    const orgMember = await ensureDefaultOrganization(user, cookieHeader);
    const orgId = String(orgMember.organization_id || '');

    const scores = await listOrganizationScores(cookieHeader, orgId, 200);
    const prompts = await ncbRead('prompts', cookieHeader);
    const promptById = new Map(
      toPublicRecords(prompts).map((p) => [String(p.id), p])
    );

    const latestByPrompt = new Map<
      string,
      {
        promptId: string;
        promptName: string;
        overallScore: number;
        createdAt: string;
        delta: number | null;
      }
    >();

    const scoresByPrompt = new Map<string, typeof scores>();
    for (const score of scores) {
      const list = scoresByPrompt.get(score.promptId) || [];
      list.push(score);
      scoresByPrompt.set(score.promptId, list);
    }

    for (const [promptId, promptScores] of Array.from(scoresByPrompt.entries())) {
      const sorted = [...promptScores].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const latest = sorted[sorted.length - 1];
      const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;
      const prompt = promptById.get(promptId);

      latestByPrompt.set(promptId, {
        promptId,
        promptName: String(prompt?.name || 'Untitled Prompt'),
        overallScore: latest.overallScore,
        createdAt: latest.createdAt,
        delta: previous ? latest.overallScore - previous.overallScore : null,
      });
    }

    const summary = Array.from(latestByPrompt.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const avgScore =
      summary.length > 0
        ? Math.round(
            summary.reduce((sum, item) => sum + item.overallScore, 0) / summary.length
          )
        : null;

    const improving = summary.filter((item) => item.delta != null && item.delta > 0).length;
    const declining = summary.filter((item) => item.delta != null && item.delta < 0).length;

    return NextResponse.json({
      summary: {
        avgScore,
        scoredPrompts: summary.length,
        improving,
        declining,
        totalScores: scores.length,
      },
      prompts: summary.slice(0, 10),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
