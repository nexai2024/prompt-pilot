import { NextRequest, NextResponse } from 'next/server';
import {
  findByPublicId,
  requireSession,
} from '@/lib/ncb-server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    await requireSession(cookieHeader);
    const { id } = await params;

    const deployment = await findByPublicId('deployments', cookieHeader, id);
    if (!deployment) {
      return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
    }

    const url = String(deployment.url || '').trim();
    if (!url) {
      return NextResponse.json({ error: 'Deployment has no URL' }, { status: 400 });
    }

    const healthUrl = url.endsWith('/') ? `${url.slice(0, -1)}/health` : `${url}/health`;
    const start = Date.now();

    try {
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'PromptPilot-HealthCheck/1.0' },
      });

      const latencyMs = Date.now() - start;
      let body: unknown = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        body = await response.json();
      } else {
        body = await response.text();
      }

      return NextResponse.json({
        healthy: response.ok,
        statusCode: response.status,
        latencyMs,
        url: healthUrl,
        body,
      });
    } catch (fetchError) {
      return NextResponse.json({
        healthy: false,
        statusCode: 0,
        latencyMs: Date.now() - start,
        url: healthUrl,
        error:
          fetchError instanceof Error ? fetchError.message : 'Health check request failed',
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
