import { NextRequest, NextResponse } from 'next/server';
import {
  ncbRead,
  requireSession,
} from '@/lib/ncb-server';

export const dynamic = 'force-dynamic';

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)] ?? 0;
}

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    await requireSession(cookieHeader);

    const timeRange = req.nextUrl.searchParams.get('timeRange') || '7d';
    const days =
      timeRange === '24h' ? 1 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const apiCalls = await ncbRead('api_calls', cookieHeader, { limit: '5000' });
    const filteredCalls = apiCalls.filter((call) => {
      if (!call.created_at) return true;
      return new Date(String(call.created_at)) >= since;
    });

    const successfulCalls = filteredCalls.filter(
      (call) => Number(call.status_code) >= 200 && Number(call.status_code) < 400
    );
    const errorCalls = filteredCalls.filter((call) => Number(call.status_code) >= 400);
    const responseTimes = filteredCalls
      .map((call) => Number(call.response_time_ms))
      .filter((value) => Number.isFinite(value));

    const totalTokens = filteredCalls.reduce(
      (sum, call) => sum + Number(call.tokens_used || 0),
      0
    );
    const totalCost = filteredCalls.reduce(
      (sum, call) => sum + Number(call.cost_cents || 0),
      0
    );

    const statusCounts = new Map<number, number>();
    for (const call of filteredCalls) {
      const code = Number(call.status_code);
      statusCounts.set(code, (statusCounts.get(code) || 0) + 1);
    }

    const regionCounts = new Map<string, number>();
    for (const call of filteredCalls) {
      const region = String(call.region || 'Unknown');
      regionCounts.set(region, (regionCounts.get(region) || 0) + 1);
    }

    const dayBuckets = new Map<string, { calls: number; errors: number; avgResponseTime: number; totalResponseTime: number }>();
    for (const call of filteredCalls) {
      const day = String(call.created_at || '').slice(0, 10) || 'unknown';
      const bucket = dayBuckets.get(day) || {
        calls: 0,
        errors: 0,
        avgResponseTime: 0,
        totalResponseTime: 0,
      };
      bucket.calls += 1;
      bucket.totalResponseTime += Number(call.response_time_ms || 0);
      if (Number(call.status_code) >= 400) bucket.errors += 1;
      dayBuckets.set(day, bucket);
    }

    const timeSeries = Array.from(dayBuckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, bucket]) => ({
        date,
        calls: bucket.calls,
        errors: bucket.errors,
        avgResponseTime:
          bucket.calls > 0
            ? Math.round(bucket.totalResponseTime / bucket.calls)
            : 0,
      }));

    const analyticsData = {
      overview: {
        totalCalls: filteredCalls.length,
        successfulCalls: successfulCalls.length,
        errorCalls: errorCalls.length,
        successRate:
          filteredCalls.length > 0
            ? Math.round((successfulCalls.length / filteredCalls.length) * 100)
            : 0,
        avgResponseTime:
          responseTimes.length > 0
            ? Math.round(
                responseTimes.reduce((sum, value) => sum + value, 0) /
                  responseTimes.length
              )
            : 0,
        totalTokens,
        totalCost: totalCost / 100,
        p50ResponseTime: percentile(responseTimes, 50),
        p95ResponseTime: percentile(responseTimes, 95),
        p99ResponseTime: percentile(responseTimes, 99),
      },
      timeSeries,
      statusCodeData: Array.from(statusCounts.entries()).map(([code, count]) => ({
        code: String(code),
        count,
      })),
      regionData: Array.from(regionCounts.entries()).map(([region, count]) => ({
        region,
        count,
      })),
      recentErrors: errorCalls.slice(0, 10).map((call) => ({
        path: call.path,
        status_code: call.status_code,
        error_message: call.error_message,
        created_at: call.created_at,
      })),
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    console.error('Analytics error:', error);
    return NextResponse.json({ error: message }, { status });
  }
}
