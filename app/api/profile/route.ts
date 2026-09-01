import { NextRequest, NextResponse } from 'next/server';
import { ncbRead, requireSession } from '@/lib/ncb-server';

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const user = await requireSession(cookieHeader);
    const profiles = await ncbRead('profiles', cookieHeader, { user_id: user.id });
    const profile = profiles[0];
    const firstName = String(profile?.first_name || '');
    const lastName = String(profile?.last_name || '');
    const name =
      [firstName, lastName].filter(Boolean).join(' ') || user.name || user.email || '';

    return NextResponse.json({
      user: {
        id: user.id,
        email: profile?.email || user.email,
        name,
        avatarUrl: profile?.avatar_url || null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
