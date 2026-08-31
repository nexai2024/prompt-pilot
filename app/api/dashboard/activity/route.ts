import { NextRequest, NextResponse } from 'next/server';
import { ncbRead, requireSession } from '@/lib/ncb-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    await requireSession(cookieHeader);

    const limit = req.nextUrl.searchParams.get('limit') || '20';
    const apiCalls = await ncbRead('api_calls', cookieHeader, {
      sort: 'created_at',
      order: 'desc',
      limit,
    });

    const activity = apiCalls.map((call) => ({
      id: call.supabase_id || String(call.id),
      method: String(call.method || 'GET'),
      path: String(call.path || '/'),
      statusCode: Number(call.status_code ?? 0),
      responseTimeMs: Number(call.response_time_ms ?? 0),
      tokensUsed: call.tokens_used != null ? Number(call.tokens_used) : null,
      costCents: call.cost_cents != null ? Number(call.cost_cents) : null,
      errorMessage: call.error_message ? String(call.error_message) : null,
      createdAt: call.created_at ? String(call.created_at) : null,
    }));

    return NextResponse.json({ activity });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
