import { NextRequest, NextResponse } from 'next/server';
import {
  ensureDefaultOrganization,
  findByPublicId,
  ncbDelete,
  ncbUpdate,
  requireSession,
} from '@/lib/ncb-server';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const user = await requireSession(cookieHeader);
    const orgMember = await ensureDefaultOrganization(user, cookieHeader);
    const orgId = String(orgMember.organization_id || '');
    const { id } = await params;

    const record = await findByPublicId('api_keys', cookieHeader, id);
    if (!record?.id) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    if (String(record.organization_id || '') !== orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const hardDelete = req.nextUrl.searchParams.get('hard') === 'true';
    if (hardDelete) {
      await ncbDelete('api_keys', cookieHeader, record.id);
    } else {
      await ncbUpdate('api_keys', cookieHeader, record.id, { is_active: 0 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
