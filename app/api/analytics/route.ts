import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Mock analytics data for demo (no database)
    const mockData = {
      overview: {
        totalCalls: 0,
        successfulCalls: 0,
        errorCalls: 0,
        successRate: 0,
        avgResponseTime: 0,
        totalTokens: 0,
        totalCost: 0,
        p50ResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
      },
      timeSeries: [],
      statusCodeData: [],
      regionData: [],
      recentErrors: []
    };

    return NextResponse.json(mockData);
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
