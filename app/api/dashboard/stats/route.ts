import { NextRequest, NextResponse } from 'next/server';
import {
  ncbRead,
  requireSession,
  toPublicRecords,
} from '@/lib/ncb-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    await requireSession(cookieHeader);

    const [prompts, endpoints, deployments, apiCalls] = await Promise.all([
      ncbRead('prompts', cookieHeader),
      ncbRead('api_endpoints', cookieHeader),
      ncbRead('deployments', cookieHeader),
      ncbRead('api_calls', cookieHeader, { limit: '1000' }),
    ]);

    const deployedPrompts = prompts.filter((p) => p.status === 'deployed').length;
    const activeDeployments = deployments.filter((d) => d.status === 'deployed').length;

    const stats = {
      prompts: {
        total: prompts.length,
        deployed: deployedPrompts,
        growth: 0,
      },
      endpoints: {
        total: endpoints.length,
        growth: 0,
      },
      deployments: {
        total: deployments.length,
        active: activeDeployments,
        growth: 0,
      },
      apiCalls: {
        total: apiCalls.length,
        growth: 0,
      },
      recent: {
        prompts: toPublicRecords(
          [...prompts]
            .sort(
              (a, b) =>
                new Date(String(b.created_at || 0)).getTime() -
                new Date(String(a.created_at || 0)).getTime()
            )
            .slice(0, 5)
        ),
        endpoints: toPublicRecords(
          [...endpoints]
            .sort(
              (a, b) =>
                new Date(String(b.created_at || 0)).getTime() -
                new Date(String(a.created_at || 0)).getTime()
            )
            .slice(0, 5)
        ),
        deployments: toPublicRecords(
          [...deployments]
            .sort(
              (a, b) =>
                new Date(String(b.created_at || 0)).getTime() -
                new Date(String(a.created_at || 0)).getTime()
            )
            .slice(0, 5)
        ),
      },
    };

    return NextResponse.json({ stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: message }, { status });
  }
}
