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

    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ prompts: data });
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
      content,
      model = 'gpt-4',
      temperature = 0.7,
      max_tokens = 150,
      status = 'draft',
      response_format = 'text',
      streaming = false,
      content_filtering = true,
      caching = true,
      tags = []
    } = body;

    if (!organization_id || !name || !content) {
      return NextResponse.json(
        { error: 'organization_id, name, and content are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('prompts')
      .insert([{
        organization_id,
        created_by: session.user.id,
        name,
        description,
        content,
        model,
        temperature,
        max_tokens,
        status,
        response_format,
        streaming,
        content_filtering,
        caching,
        tags
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ prompt: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
