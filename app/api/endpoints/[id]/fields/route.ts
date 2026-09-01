import { NextRequest, NextResponse } from 'next/server';
import {
  findByPublicId,
  ncbCreate,
  ncbDelete,
  ncbRead,
  newSupabaseId,
  requireSession,
  toPublicRecords,
} from '@/lib/ncb-server';
import { maybeSnapshotForIoChange } from '@/lib/prompt-versions';

function validateFields(fields: unknown[]): boolean {
  return fields.every((field) => {
    if (typeof field !== 'object' || field === null) return false;
    const record = field as Record<string, unknown>;
    return (
      typeof record.name === 'string' &&
      record.name.trim().length > 0 &&
      typeof record.type === 'string'
    );
  });
}

function normalizeFields(fields: unknown[]): Array<{
  name: string;
  type: string;
  required: boolean;
  description: string;
}> {
  if (!Array.isArray(fields)) return [];

  return fields
    .filter(
      (field) =>
        typeof field === 'object' &&
        field !== null &&
        typeof (field as Record<string, unknown>).name === 'string' &&
        String((field as Record<string, unknown>).name).trim().length > 0
    )
    .map((field) => {
      const record = field as Record<string, unknown>;
      return {
        name: String(record.name).trim(),
        type: typeof record.type === 'string' ? record.type : 'string',
        required: Boolean(record.required),
        description:
          typeof record.description === 'string' ? record.description : '',
      };
    });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const cookieHeader = req.headers.get('cookie') || '';
    await requireSession(cookieHeader);

    const endpoint = await findByPublicId('api_endpoints', cookieHeader, id);
    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    const fields = await ncbRead('endpoint_fields', cookieHeader, {
      endpoint_id: id,
    });

    const requestFields = fields
      .filter((f) => f.field_type === 'request')
      .map((f) => ({
        id: f.supabase_id || String(f.id),
        name: f.name,
        type: f.data_type || 'string',
        required: f.required === 1,
        description: f.description || '',
      }));

    const responseFields = fields
      .filter((f) => f.field_type === 'response')
      .map((f) => ({
        id: f.supabase_id || String(f.id),
        name: f.name,
        type: f.data_type || 'string',
        required: f.required === 1,
        description: f.description || '',
      }));

    return NextResponse.json({ requestFields, responseFields });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const user = await requireSession(cookieHeader);

    const endpoint = await findByPublicId('api_endpoints', cookieHeader, id);
    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    const body = await req.json();
    const requestFields = normalizeFields(body.requestFields);
    const responseFields = normalizeFields(body.responseFields);

    if (!validateFields(requestFields) || !validateFields(responseFields)) {
      return NextResponse.json({ error: 'Invalid field data' }, { status: 400 });
    }

    const existing = await ncbRead('endpoint_fields', cookieHeader, {
      endpoint_id: id,
    });

    for (const field of existing) {
      if (field.id) {
        await ncbDelete('endpoint_fields', cookieHeader, field.id);
      }
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    for (const field of requestFields) {
      await ncbCreate('endpoint_fields', cookieHeader, {
        supabase_id: newSupabaseId(),
        endpoint_id: id,
        field_type: 'request',
        name: field.name,
        data_type: field.type || 'string',
        required: field.required ? 1 : 0,
        description: field.description || null,
        created_at: now,
        user_id: user.id,
      });
    }

    for (const field of responseFields) {
      await ncbCreate('endpoint_fields', cookieHeader, {
        supabase_id: newSupabaseId(),
        endpoint_id: id,
        field_type: 'response',
        name: field.name,
        data_type: field.type || 'string',
        required: field.required ? 1 : 0,
        description: field.description || null,
        created_at: now,
        user_id: user.id,
      });
    }

    const fields = await ncbRead('endpoint_fields', cookieHeader, {
      endpoint_id: id,
    });

    const linkedPromptId = endpoint.prompt_id ? String(endpoint.prompt_id) : '';
    if (linkedPromptId) {
      const prompt = await findByPublicId('prompts', cookieHeader, linkedPromptId);
      if (prompt) {
        await maybeSnapshotForIoChange(cookieHeader, user.id, prompt);
      }
    }

    return NextResponse.json({ fields: toPublicRecords(fields) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    console.error('Error in PUT /api/endpoints/[id]/fields:', error);
    return NextResponse.json({ error: message }, { status });
  }
}
