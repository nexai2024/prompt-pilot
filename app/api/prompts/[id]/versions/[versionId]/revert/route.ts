import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    // Mock successful revert (no database)
    const mockPrompt = {
      id: params.id,
      reverted_from_version: params.versionId,
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({ prompt: mockPrompt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
