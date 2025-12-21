import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log("userId", userId)
    const supabase = createServerSupabaseClient();
    const { data: prompts, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching prompts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ prompts: prompts || [] });
  } catch (error: any) {
    console.error('Error in GET /api/prompts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
      model = 'gpt-4',
      temperature = 0.7,
      max_tokens = 150,
      response_format = 'text',
      streaming = false,
      content_filtering = true,
      caching = true,
      status = 'draft'
    } = body;

    if (!name || !content) {
      return NextResponse.json(
        { error: 'name and content are required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Debug: Check if we can query organization_members
    console.log('Attempting to fetch organization for userId:', userId);
    
    // Get user's organization_id - query by clerk_user_id
    const { data: orgMember, error: orgError, count } = await supabase
      .from('organization_members')
      .select('organization_id, clerk_user_id, user_id', { count: 'exact' })
      .eq('clerk_user_id', userId)
      .limit(1)
      .maybeSingle();
    
    console.log('Organization query result:', { 
      orgMember, 
      orgError, 
      errorCode: orgError?.code,
      errorMessage: orgError?.message,
      errorDetails: orgError?.details,
      errorHint: orgError?.hint,
      count
    });

    if (orgError) {
      console.error('Error fetching organization:', orgError);
      // If it's an RLS error, provide more helpful message
      if (orgError.code === 'PGRST301' || orgError.message?.includes('permission denied') || orgError.message?.includes('RLS')) {
        return NextResponse.json(
          { 
            error: 'Permission denied. This might be an RLS policy issue. Check that your Clerk JWT is properly configured in Supabase.',
            details: orgError.message 
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { 
          error: 'Failed to find user organization',
          details: orgError.message 
        },
        { status: 500 }
      );
    }

    if (!orgMember) {
      console.error('No organization found for user:', userId);
      return NextResponse.json(
        { error: 'No organization found for user. Please ensure you have an organization set up.' },
        { status: 404 }
      );
    }

    console.log('Inserting prompt with organization_id:', orgMember.organization_id);
    
    // Insert prompt into database
    const { data: prompt, error: insertError } = await supabase
      .from('prompts')
      .insert({
        organization_id: orgMember.organization_id,
        clerk_user_id: userId,
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
      })
      .select()
      .single();

    console.log('Insert result:', {
      prompt,
      insertError,
      errorCode: insertError?.code,
      errorMessage: insertError?.message,
      errorDetails: insertError?.details,
      errorHint: insertError?.hint
    });

    if (insertError) {
      console.error('Error inserting prompt:', insertError);
      // If it's an RLS error, provide more helpful message
      if (insertError.code === 'PGRST301' || insertError.message?.includes('permission denied') || insertError.message?.includes('RLS')) {
        return NextResponse.json(
          { 
            error: 'Permission denied when saving prompt. This might be an RLS policy issue.',
            details: insertError.message 
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { 
          error: insertError.message || 'Failed to save prompt',
          details: insertError.details,
          hint: insertError.hint
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ prompt }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/prompts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
