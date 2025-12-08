import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: version, error: versionError } = await supabase
      .from('prompt_versions')
      .select('*')
      .eq('id', params.versionId)
      .eq('prompt_id', params.id)
      .single();

    if (versionError || !version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    const { data: prompt, error: updateError } = await supabase
      .from('prompts')
      .update({
        content: version.content,
        model: version.model,
        temperature: version.temperature,
        max_tokens: version.max_tokens,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('created_by', session.user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { data: latestVersion } = await supabase
      .from('prompt_versions')
      .select('version_number')
      .eq('prompt_id', params.id)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersionNumber = latestVersion ? latestVersion.version_number + 1 : 1;

    const { data: newVersion, error: newVersionError } = await supabase
      .from('prompt_versions')
      .insert([{
        prompt_id: params.id,
        version_number: nextVersionNumber,
        content: version.content,
        model: version.model,
        temperature: version.temperature,
        max_tokens: version.max_tokens,
        created_by: session.user.id
      }])
      .select()
      .single();

    if (newVersionError) {
      console.error('Error creating new version after revert:', newVersionError);
    }

    return NextResponse.json({ prompt, version: newVersion });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
