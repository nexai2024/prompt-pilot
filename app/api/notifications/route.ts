import { NextRequest, NextResponse } from 'next/server';
import {
  ensureDefaultOrganization,
  ncbRead,
  requireSession,
  toPublicRecords,
} from '@/lib/ncb-server';
import { listOrganizationScores } from '@/lib/prompt-score-storage';

export const dynamic = 'force-dynamic';

export interface AppNotification {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  href?: string;
  createdAt: string;
}

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const user = await requireSession(cookieHeader);
    const orgMember = await ensureDefaultOrganization(user, cookieHeader);
    const orgId = String(orgMember.organization_id || '');

    const apiCalls = await ncbRead('api_calls', cookieHeader, {
      sort: 'created_at',
      order: 'desc',
      limit: '30',
    }).catch(() => []);
    const deployments = await ncbRead('deployments', cookieHeader, {
      sort: 'created_at',
      order: 'desc',
      limit: '20',
    }).catch(() => []);
    const prompts = await ncbRead('prompts', cookieHeader, {
      sort: 'created_at',
      order: 'desc',
      limit: '20',
    }).catch(() => []);
    const scores = await listOrganizationScores(cookieHeader, orgId, 80).catch(() => []);

    const notifications: AppNotification[] = [];

    for (const call of apiCalls) {
      const status = Number(call.status_code ?? 0);
      if (status < 400) continue;
      notifications.push({
        id: `call-${call.supabase_id || call.id}`,
        type: 'error',
        title: `${call.method || 'GET'} ${call.path || '/'} failed`,
        message: String(call.error_message || `Status ${status}`),
        href: '/analytics',
        createdAt: String(call.created_at || new Date().toISOString()),
      });
    }

    for (const deployment of deployments) {
      if (String(deployment.status) !== 'failed') continue;
      notifications.push({
        id: `deploy-${deployment.supabase_id || deployment.id}`,
        type: 'error',
        title: `${deployment.name || 'Deployment'} failed`,
        message: String(deployment.error_message || 'The latest deploy did not succeed.'),
        href: '/deployments',
        createdAt: String(deployment.updated_at || deployment.created_at || new Date().toISOString()),
      });
    }

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
      if (!latest || !previous || latest.overallScore >= previous.overallScore) continue;
      const prompt = toPublicRecords(prompts).find((item) => String(item.id) === promptId);
      notifications.push({
        id: `score-${promptId}-${latest.createdAt}`,
        type: 'warning',
        title: `${prompt?.name || 'Prompt'} score dropped`,
        message: `Quality fell from ${previous.overallScore} to ${latest.overallScore}.`,
        href: `/prompt-studio?promptId=${promptId}`,
        createdAt: latest.createdAt,
      });
    }

    if (prompts.length === 0) {
      notifications.push({
        id: 'tip-first-prompt',
        type: 'info',
        title: 'Create your first prompt',
        message: 'Start from a template or open Prompt Studio to ship an API faster.',
        href: '/templates',
        createdAt: new Date().toISOString(),
      });
    }

    notifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ notifications: notifications.slice(0, 20) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
