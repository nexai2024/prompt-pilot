import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');
    const timeRange = searchParams.get('timeRange') || '7d';

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
    }

    // Calculate time range
    const now = new Date();
    const timeRanges: Record<string, number> = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
    };
    const startTime = new Date(now.getTime() - (timeRanges[timeRange] || timeRanges['7d']));

    // Fetch API calls data
    const { data: calls, error: callsError } = await supabase
      .from('api_calls')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: true });

    if (callsError) {
      return NextResponse.json({ error: callsError.message }, { status: 500 });
    }

    const apiCalls = calls || [];

    // Calculate overall metrics
    const totalCalls = apiCalls.length;
    const successfulCalls = apiCalls.filter(c => c.status_code >= 200 && c.status_code < 300).length;
    const errorCalls = apiCalls.filter(c => c.status_code >= 400).length;
    const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
    const avgResponseTime = totalCalls > 0
      ? apiCalls.reduce((sum, c) => sum + c.response_time_ms, 0) / totalCalls
      : 0;
    const totalTokens = apiCalls.reduce((sum, c) => sum + (c.tokens_used || 0), 0);
    const totalCost = apiCalls.reduce((sum, c) => sum + (c.cost_cents || 0), 0);

    // Group by time for time series
    const timeSeriesData: Record<string, any> = {};
    apiCalls.forEach(call => {
      const date = new Date(call.created_at);
      const key = timeRange === '24h'
        ? `${date.getHours()}:00`
        : date.toLocaleDateString();

      if (!timeSeriesData[key]) {
        timeSeriesData[key] = {
          time: key,
          calls: 0,
          tokens: 0,
          cost: 0,
          avgResponseTime: 0,
          responseTimes: []
        };
      }

      timeSeriesData[key].calls += 1;
      timeSeriesData[key].tokens += call.tokens_used || 0;
      timeSeriesData[key].cost += call.cost_cents || 0;
      timeSeriesData[key].responseTimes.push(call.response_time_ms);
    });

    // Calculate average response time per time bucket
    const timeSeries = Object.values(timeSeriesData).map((bucket: any) => ({
      time: bucket.time,
      calls: bucket.calls,
      tokens: bucket.tokens,
      cost: bucket.cost / 100, // Convert to dollars
      avgResponseTime: bucket.responseTimes.reduce((a: number, b: number) => a + b, 0) / bucket.responseTimes.length
    }));

    // Status code distribution
    const statusCodeDistribution = apiCalls.reduce((acc: Record<string, number>, call) => {
      const statusRange = `${Math.floor(call.status_code / 100)}xx`;
      acc[statusRange] = (acc[statusRange] || 0) + 1;
      return acc;
    }, {});

    // Convert to array for charts
    const statusCodeData = Object.entries(statusCodeDistribution).map(([status, count]) => ({
      status,
      count,
      percentage: totalCalls > 0 ? (count / totalCalls) * 100 : 0
    }));

    // Geographic distribution
    const regionDistribution = apiCalls.reduce((acc: Record<string, number>, call) => {
      const region = call.country || 'Unknown';
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {});

    const regionData = Object.entries(regionDistribution)
      .map(([region, count]) => ({
        region,
        count,
        percentage: totalCalls > 0 ? (count / totalCalls) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 regions

    // Response time percentiles
    const responseTimes = apiCalls.map(c => c.response_time_ms).sort((a, b) => a - b);
    const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)] || 0;
    const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0;
    const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)] || 0;

    // Recent errors
    const recentErrors = apiCalls
      .filter(c => c.status_code >= 400)
      .slice(-10)
      .reverse()
      .map(c => ({
        id: c.id,
        path: c.path,
        status_code: c.status_code,
        error_message: c.error_message,
        created_at: c.created_at
      }));

    return NextResponse.json({
      overview: {
        totalCalls,
        successfulCalls,
        errorCalls,
        successRate: Math.round(successRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime),
        totalTokens,
        totalCost: totalCost / 100, // Convert to dollars
        p50ResponseTime: Math.round(p50),
        p95ResponseTime: Math.round(p95),
        p99ResponseTime: Math.round(p99)
      },
      timeSeries,
      statusCodeData,
      regionData,
      recentErrors
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
