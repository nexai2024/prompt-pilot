import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: endpoint, error } = await supabase
      .from('api_endpoints')
      .select(`
        *,
        prompt:prompts(id, name, content),
        fields:endpoint_fields(*)
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const requestFields = endpoint.fields?.filter((f: any) => f.field_type === 'request') || [];
    const responseFields = endpoint.fields?.filter((f: any) => f.field_type === 'response') || [];

    return NextResponse.json({
      endpoint: {
        ...endpoint,
        request_fields: requestFields,
        response_fields: responseFields
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { request_fields, response_fields, ...endpointData } = body;

    delete endpointData.id;
    delete endpointData.created_at;
    delete endpointData.created_by;
    delete endpointData.organization_id;
    delete endpointData.fields;
    delete endpointData.prompt;

    // Update endpoint
    const { data: endpoint, error: endpointError } = await supabase
      .from('api_endpoints')
      .update({ ...endpointData, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('created_by', session.user.id)
      .select()
      .single();

    if (endpointError) {
      return NextResponse.json({ error: endpointError.message }, { status: 500 });
    }

    // Update fields if provided
    if (request_fields !== undefined || response_fields !== undefined) {
      // Delete existing fields
      await supabase
        .from('endpoint_fields')
        .delete()
        .eq('endpoint_id', params.id);

      // Insert new fields
      const fieldsToInsert = [
        ...(request_fields || []).map((f: any) => ({
          endpoint_id: params.id,
          field_type: 'request',
          ...f
        })),
        ...(response_fields || []).map((f: any) => ({
          endpoint_id: params.id,
          field_type: 'response',
          ...f
        }))
      ];

      if (fieldsToInsert.length > 0) {
        await supabase
          .from('endpoint_fields')
          .insert(fieldsToInsert);
      }
    }

    return NextResponse.json({ endpoint });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('api_endpoints')
      .delete()
      .eq('id', params.id)
      .eq('created_by', session.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
