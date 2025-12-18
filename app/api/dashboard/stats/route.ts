import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Mock stats for demo (no database)
    const stats = {
      prompts: {
        total: 0,
        deployed: 0,
        growth: 0
      },
      endpoints: {
        total: 0,
        growth: 0
      },
      deployments: {
        total: 0,
        active: 0,
        growth: 0
      },
      apiCalls: {
        total: 0,
        growth: 0
      },
      recent: {
        prompts: [],
        endpoints: [],
        deployments: []
      }
    };

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
