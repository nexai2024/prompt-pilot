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

    const { data, error } = await supabase
      .from('prompt_variables')
      .select('*')
      .eq('prompt_id', params.id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ variables: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
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
    const { variables } = body;

    if (!Array.isArray(variables)) {
      return NextResponse.json({ error: 'variables must be an array' }, { status: 400 });
    }

    // Delete existing variables
    await supabase
      .from('prompt_variables')
      .delete()
      .eq('prompt_id', params.id);

    // Insert new variables
    if (variables.length > 0) {
      const { data, error } = await supabase
        .from('prompt_variables')
        .insert(
          variables.map(v => ({
            prompt_id: params.id,
            name: v.name,
            type: v.type || 'string',
            description: v.description || '',
            default_value: v.default_value || '',
            required: v.required || false
          }))
        )
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ variables: data });
    }

    return NextResponse.json({ variables: [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
