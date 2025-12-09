import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
    }

    // Get prompts count
    const { count: promptsCount } = await supabase
      .from('prompts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    // Get deployed prompts count
    const { count: deployedPromptsCount } = await supabase
      .from('prompts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'deployed');

    // Get API endpoints count
    const { count: endpointsCount } = await supabase
      .from('api_endpoints')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    // Get deployments count
    const { count: deploymentsCount } = await supabase
      .from('deployments')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    // Get active deployments count
    const { count: activeDeploymentsCount } = await supabase
      .from('deployments')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'deployed');

    // Get total API calls (if any exist)
    const { count: totalApiCalls } = await supabase
      .from('api_calls')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    // Get recent prompts
    const { data: recentPrompts } = await supabase
      .from('prompts')
      .select('id, name, status, model, created_at, updated_at')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })
      .limit(5);

    // Get recent endpoints
    const { data: recentEndpoints } = await supabase
      .from('api_endpoints')
      .select('id, name, method, path, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get recent deployments
    const { data: recentDeployments } = await supabase
      .from('deployments')
      .select('id, name, status, environment, deployed_at, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Calculate growth (compare with last 30 days if we had historical data)
    // For now, return 0 growth
    const stats = {
      prompts: {
        total: promptsCount || 0,
        deployed: deployedPromptsCount || 0,
        growth: 0
      },
      endpoints: {
        total: endpointsCount || 0,
        growth: 0
      },
      deployments: {
        total: deploymentsCount || 0,
        active: activeDeploymentsCount || 0,
        growth: 0
      },
      apiCalls: {
        total: totalApiCalls || 0,
        growth: 0
      },
      recent: {
        prompts: recentPrompts || [],
        endpoints: recentEndpoints || [],
        deployments: recentDeployments || []
      }
    };

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
