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

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
    }

    const { data: endpoints, error: endpointsError } = await supabase
      .from('api_endpoints')
      .select(`
        *,
        prompt:prompts(id, name),
        request_fields:endpoint_fields!endpoint_fields_endpoint_id_fkey(*)
      `)
      .eq('organization_id', organizationId)
      .eq('endpoint_fields.field_type', 'request')
      .order('created_at', { ascending: false });

    if (endpointsError) {
      return NextResponse.json({ error: endpointsError.message }, { status: 500 });
    }

    return NextResponse.json({ endpoints: endpoints || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      organization_id,
      name,
      description,
      method = 'POST',
      path,
      prompt_id,
      authentication = 'api-key',
      rate_limit = 100,
      cors_enabled = true,
      request_validation = true,
      request_logging = true,
      request_fields = [],
      response_fields = []
    } = body;

    if (!organization_id || !name || !path) {
      return NextResponse.json(
        { error: 'organization_id, name, and path are required' },
        { status: 400 }
      );
    }

    // Create endpoint
    const { data: endpoint, error: endpointError } = await supabase
      .from('api_endpoints')
      .insert([{
        organization_id,
        created_by: session.user.id,
        prompt_id,
        name,
        description,
        method,
        path,
        authentication,
        rate_limit,
        cors_enabled,
        request_validation,
        request_logging
      }])
      .select()
      .single();

    if (endpointError) {
      return NextResponse.json({ error: endpointError.message }, { status: 500 });
    }

    // Create fields
    const fieldsToInsert = [
      ...request_fields.map((f: any) => ({
        endpoint_id: endpoint.id,
        field_type: 'request',
        ...f
      })),
      ...response_fields.map((f: any) => ({
        endpoint_id: endpoint.id,
        field_type: 'response',
        ...f
      }))
    ];

    if (fieldsToInsert.length > 0) {
      await supabase
        .from('endpoint_fields')
        .insert(fieldsToInsert);
    }

    return NextResponse.json({ endpoint }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
