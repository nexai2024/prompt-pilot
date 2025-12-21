import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { id, versionId } = await params;
  try {
    // Mock successful revert (no database)
    const mockPrompt = {
      id: id,
      reverted_from_version: versionId,
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({ prompt: mockPrompt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
