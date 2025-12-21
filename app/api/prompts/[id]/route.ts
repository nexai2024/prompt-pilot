import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    const { data: prompt, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching prompt:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    return NextResponse.json({ prompt });
  } catch (error: any) {
    console.error('Error in GET /api/prompts/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      description,
      content,
      model,
      temperature,
      max_tokens,
      response_format,
      streaming,
      content_filtering,
      caching,
      status
    } = body;

    const supabase = createServerSupabaseClient();

    // First verify the prompt exists and belongs to the user
    const { data: existingPrompt, error: fetchError } = await supabase
      .from('prompts')
      .select('id')
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .single();

    if (fetchError || !existingPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (content !== undefined) updateData.content = content;
    if (model !== undefined) updateData.model = model;
    if (temperature !== undefined) updateData.temperature = temperature;
    if (max_tokens !== undefined) updateData.max_tokens = max_tokens;
    if (response_format !== undefined) updateData.response_format = response_format;
    if (streaming !== undefined) updateData.streaming = streaming;
    if (content_filtering !== undefined) updateData.content_filtering = content_filtering;
    if (caching !== undefined) updateData.caching = caching;
    if (status !== undefined) updateData.status = status;

    const { data: prompt, error: updateError } = await supabase
      .from('prompts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating prompt:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ prompt });
  } catch (error: any) {
    console.error('Error in PUT /api/prompts/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // Verify the prompt exists and belongs to the user
    const { data: existingPrompt, error: fetchError } = await supabase
      .from('prompts')
      .select('id')
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .single();

    if (fetchError || !existingPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from('prompts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting prompt:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/prompts/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
