import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  ENHANCE_USER_TEMPLATE,
  GENERATE_USER_TEMPLATE,
  normalizeEnhancedResult,
  normalizeGeneratedResult,
  parseAssistJson,
  PROMPT_ENGINEER_SYSTEM,
} from '@/lib/prompt-assist';
import {
  getOrganizationMember,
  logApiCall,
  requireSession,
} from '@/lib/ncb-server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const ASSIST_MODEL = 'gpt-4o-mini';

function getClientIp(req: NextRequest): string | undefined {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    undefined
  );
}

function estimateCostCents(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1000) * 0.00015;
  const outputCost = (outputTokens / 1000) * 0.0006;
  return Math.round((inputCost + outputCost) * 100);
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const cookieHeader = req.headers.get('cookie') || '';
  let userId: string | undefined;
  let organizationId: string | undefined;
  let logPath = '/api/llm/prompt-assist';
  let requestBody = '';

  try {
    const user = await requireSession(cookieHeader);
    userId = user.id;

    const orgMember = await getOrganizationMember(user.id, cookieHeader);
    organizationId = orgMember?.organization_id
      ? String(orgMember.organization_id)
      : undefined;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured on server' },
        { status: 500 }
      );
    }

    requestBody = await req.text();
    const body = JSON.parse(requestBody) as {
      action: 'generate' | 'enhance';
      description?: string;
      prompt?: string;
      use_case?: string;
      tone?: string;
      output_format?: string;
      goals?: string;
      prompt_id?: string;
    };

    const { action, prompt_id } = body;
    logPath = prompt_id
      ? `/api/prompts/${prompt_id}/assist/${action}`
      : `/api/llm/prompt-assist/${action}`;

    if (action === 'generate') {
      if (!body.description?.trim()) {
        return NextResponse.json(
          { error: 'Description is required for prompt generation' },
          { status: 400 }
        );
      }

      const userMessage = GENERATE_USER_TEMPLATE({
        description: body.description.trim(),
        useCase: body.use_case,
        tone: body.tone,
        outputFormat: body.output_format,
      });

      const completion = await openai.chat.completions.create({
        model: ASSIST_MODEL,
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: PROMPT_ENGINEER_SYSTEM },
          { role: 'user', content: userMessage },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error('No response from AI');

      const result = normalizeGeneratedResult(
        parseAssistJson<Record<string, unknown>>(raw)
      );
      if (!result.prompt?.trim()) {
        throw new Error('AI did not return a valid prompt');
      }

      const usage = completion.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      const latency_ms = Date.now() - startTime;
      const cost_cents = estimateCostCents(usage.prompt_tokens, usage.completion_tokens);

      const responsePayload = { ...result, latency_ms, tokens_used: usage.total_tokens, cost_cents };

      await logApiCall(cookieHeader, userId, {
        organization_id: organizationId,
        method: 'POST',
        path: logPath,
        status_code: 200,
        response_time_ms: latency_ms,
        request_size_bytes: Buffer.byteLength(requestBody, 'utf8'),
        response_size_bytes: Buffer.byteLength(JSON.stringify(responsePayload), 'utf8'),
        user_agent: req.headers.get('user-agent') || undefined,
        ip_address: getClientIp(req),
        tokens_used: usage.total_tokens,
        cost_cents,
      });

      return NextResponse.json(responsePayload);
    }

    if (action === 'enhance') {
      if (!body.prompt?.trim()) {
        return NextResponse.json(
          { error: 'Prompt content is required for enhancement' },
          { status: 400 }
        );
      }

      const userMessage = ENHANCE_USER_TEMPLATE({
        prompt: body.prompt.trim(),
        goals: body.goals,
      });

      const completion = await openai.chat.completions.create({
        model: ASSIST_MODEL,
        temperature: 0.5,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: PROMPT_ENGINEER_SYSTEM },
          { role: 'user', content: userMessage },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error('No response from AI');

      const result = normalizeEnhancedResult(
        parseAssistJson<Record<string, unknown>>(raw)
      );
      if (!result.prompt?.trim()) {
        throw new Error('AI did not return an enhanced prompt');
      }

      const usage = completion.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      const latency_ms = Date.now() - startTime;
      const cost_cents = estimateCostCents(usage.prompt_tokens, usage.completion_tokens);

      const responsePayload = { ...result, latency_ms, tokens_used: usage.total_tokens, cost_cents };

      await logApiCall(cookieHeader, userId, {
        organization_id: organizationId,
        method: 'POST',
        path: logPath,
        status_code: 200,
        response_time_ms: latency_ms,
        request_size_bytes: Buffer.byteLength(requestBody, 'utf8'),
        response_size_bytes: Buffer.byteLength(JSON.stringify(responsePayload), 'utf8'),
        user_agent: req.headers.get('user-agent') || undefined,
        ip_address: getClientIp(req),
        tokens_used: usage.total_tokens,
        cost_cents,
      });

      return NextResponse.json(responsePayload);
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "generate" or "enhance".' },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Prompt assist failed';
    const status = message === 'Unauthorized' ? 401 : 500;
    console.error('Prompt assist error:', error);

    if (userId) {
      await logApiCall(cookieHeader, userId, {
        organization_id: organizationId,
        method: 'POST',
        path: logPath,
        status_code: status,
        response_time_ms: Date.now() - startTime,
        request_size_bytes: requestBody ? Buffer.byteLength(requestBody, 'utf8') : undefined,
        user_agent: req.headers.get('user-agent') || undefined,
        ip_address: getClientIp(req),
        error_message: message,
      });
    }

    return NextResponse.json({ error: message }, { status });
  }
}
