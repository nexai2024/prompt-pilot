import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Mock data for demo (no database)
    return NextResponse.json({ endpoints: [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Mock successful creation (no database)
    const mockEndpoint = {
      id: Math.random().toString(36).substr(2, 9),
      ...body,
      created_at: new Date().toISOString()
    };

    return NextResponse.json({ endpoint: mockEndpoint }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
