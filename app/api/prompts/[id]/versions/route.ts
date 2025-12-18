import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Mock data for demo (no database)
    return NextResponse.json({ versions: [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    // Mock successful version creation (no database)
    const mockVersion = {
      id: Math.random().toString(36).substr(2, 9),
      prompt_id: params.id,
      version_number: 1,
      ...body,
      created_at: new Date().toISOString()
    };

    return NextResponse.json({ version: mockVersion }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
