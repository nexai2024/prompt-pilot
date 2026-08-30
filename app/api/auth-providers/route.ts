import { NextResponse } from 'next/server';
import { NCB_CONFIG } from '@/lib/ncb-utils';

export async function GET() {
  const url = `${NCB_CONFIG.authApiUrl}/providers?instance=${NCB_CONFIG.instance}`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      'X-Database-Instance': NCB_CONFIG.instance,
      Authorization: `Bearer ${NCB_CONFIG.secretKey}`,
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Unable to load authentication providers' },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json({ providers: data.providers || data });
}
