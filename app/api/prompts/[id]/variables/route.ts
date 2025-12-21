import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Mock data for demo (no database)
    return NextResponse.json({ variables: [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();

    // Mock successful creation (no database)
    const mockVariable = {
      id: Math.random().toString(36).substr(2, 9),
      prompt_id: id,
      ...body,
      created_at: new Date().toISOString()
    };

    return NextResponse.json({ variable: mockVariable }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
