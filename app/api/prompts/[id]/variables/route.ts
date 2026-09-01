import { NextRequest, NextResponse } from 'next/server';
import {
  boolToInt,
  ncbCreate,
  ncbRead,
  newSupabaseId,
  requireSession,
  toPublicRecord,
  toPublicRecords,
} from '@/lib/ncb-server';
import {
  replacePromptVariables,
  type PromptVariableInput,
} from '@/lib/prompt-versions';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const cookieHeader = req.headers.get('cookie') || '';
    await requireSession(cookieHeader);

    const variables = await ncbRead('prompt_variables', cookieHeader, {
      prompt_id: id,
    });

    return NextResponse.json({ variables: toPublicRecords(variables) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const user = await requireSession(cookieHeader);
    const body = await req.json();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const variableInputs = Array.isArray(body.variables)
      ? (body.variables as PromptVariableInput[])
      : [body as PromptVariableInput];

    if (Array.isArray(body.variables)) {
      await replacePromptVariables(cookieHeader, user.id, id, variableInputs);
      const variables = await ncbRead('prompt_variables', cookieHeader, {
        prompt_id: id,
      });
      return NextResponse.json({ variables: toPublicRecords(variables) }, { status: 201 });
    }

    const created = [];
    for (const variable of variableInputs) {
      if (!variable?.name) continue;

      const record = await ncbCreate('prompt_variables', cookieHeader, {
        supabase_id: newSupabaseId(),
        prompt_id: id,
        name: variable.name,
        type: variable.type || 'string',
        description: variable.description || null,
        default_value: variable.default_value || variable.value || null,
        required: boolToInt(Boolean(variable.required)),
        created_at: now,
        user_id: user.id,
      });

      created.push(toPublicRecord(record));
    }

    if (created.length === 1) {
      return NextResponse.json({ variable: created[0] }, { status: 201 });
    }

    return NextResponse.json({ variables: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
