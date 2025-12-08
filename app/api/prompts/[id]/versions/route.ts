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

    const { data: versions, error } = await supabase
      .from('prompt_versions')
      .select(`
        *,
        creator:auth.users!created_by(email)
      `)
      .eq('prompt_id', params.id)
      .order('version_number', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ versions });
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
    const { content, model, temperature, max_tokens } = body;

    const { data: latestVersion } = await supabase
      .from('prompt_versions')
      .select('version_number')
      .eq('prompt_id', params.id)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersionNumber = latestVersion ? latestVersion.version_number + 1 : 1;

    const { data: version, error } = await supabase
      .from('prompt_versions')
      .insert([{
        prompt_id: params.id,
        version_number: nextVersionNumber,
        content,
        model,
        temperature,
        max_tokens,
        created_by: session.user.id
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ version });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
