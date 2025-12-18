import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Mock data for demo (no database)
    return NextResponse.json({ prompts: [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      description,
      content,
      model = 'gpt-4',
      temperature = 0.7,
      max_tokens = 150,
      status = 'draft'
    } = body;

    if (!name || !content) {
      return NextResponse.json(
        { error: 'name and content are required' },
        { status: 400 }
      );
    }

    // Mock successful save (no database)
    const mockPrompt = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      description,
      content,
      model,
      temperature,
      max_tokens,
      status,
      created_at: new Date().toISOString()
    };

    return NextResponse.json({ prompt: mockPrompt }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
