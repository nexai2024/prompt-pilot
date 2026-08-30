import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { CohereClient } from 'cohere-ai';
import {
  ensureDefaultOrganization,
  logApiCall,
  requireSession,
} from '@/lib/ncb-server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY || '',
});

const MODEL_PRICING: Record<string, { input: number; output: number; provider: string }> = {
  'gpt-4': { input: 0.03, output: 0.06, provider: 'openai' },
  'gpt-4-turbo': { input: 0.01, output: 0.03, provider: 'openai' },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015, provider: 'openai' },
  'claude-3-opus-20240229': { input: 0.015, output: 0.075, provider: 'anthropic' },
  'claude-3-sonnet-20240229': { input: 0.003, output: 0.015, provider: 'anthropic' },
  'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125, provider: 'anthropic' },
  'claude-3-opus': { input: 0.015, output: 0.075, provider: 'anthropic' },
  'claude-3-sonnet': { input: 0.003, output: 0.015, provider: 'anthropic' },
  'claude-3-haiku': { input: 0.00025, output: 0.00125, provider: 'anthropic' },
  command: { input: 0.001, output: 0.002, provider: 'cohere' },
  'command-light': { input: 0.0003, output: 0.0006, provider: 'cohere' },
  'command-r': { input: 0.0005, output: 0.0015, provider: 'cohere' },
  'command-r-plus': { input: 0.003, output: 0.015, provider: 'cohere' },
};

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] || { input: 0.001, output: 0.002 };
  const inputCost = (inputTokens / 1000) * pricing.input;
  const outputCost = (outputTokens / 1000) * pricing.output;
  return Math.round((inputCost + outputCost) * 100);
}

function getProvider(model: string): string {
  return MODEL_PRICING[model]?.provider || 'openai';
}

function buildLogPath(promptId?: string): string {
  return promptId ? `/api/prompts/${promptId}/test` : '/api/llm/execute';
}

function getClientIp(req: NextRequest): string | undefined {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    undefined
  );
}

async function executeOpenAI(
  prompt: string,
  model: string,
  temperature: number,
  max_tokens: number,
  top_p: number,
  frequency_penalty: number,
  presence_penalty: number,
  stop_sequences?: string[]
) {
  const response = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature,
    max_tokens,
    top_p,
    frequency_penalty,
    presence_penalty,
    stop: stop_sequences && stop_sequences.length > 0 ? stop_sequences : undefined,
  });

  const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  return {
    content: response.choices[0]?.message?.content || '',
    usage: {
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens,
    },
  };
}

async function executeAnthropic(
  prompt: string,
  model: string,
  temperature: number,
  max_tokens: number
) {
  const response = await anthropic.messages.create({
    model,
    max_tokens,
    temperature,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  const text = content.type === 'text' ? content.text : '';

  return {
    content: text,
    usage: {
      prompt_tokens: response.usage.input_tokens,
      completion_tokens: response.usage.output_tokens,
      total_tokens: response.usage.input_tokens + response.usage.output_tokens,
    },
  };
}

async function executeCohere(
  prompt: string,
  model: string,
  temperature: number,
  max_tokens: number
) {
  const response = await cohere.chat({
    model,
    message: prompt,
    temperature,
    maxTokens: max_tokens,
  });

  const estimatedPromptTokens = Math.ceil(prompt.length / 4);
  const estimatedCompletionTokens = Math.ceil((response.text || '').length / 4);

  return {
    content: response.text || '',
    usage: {
      prompt_tokens: estimatedPromptTokens,
      completion_tokens: estimatedCompletionTokens,
      total_tokens: estimatedPromptTokens + estimatedCompletionTokens,
    },
  };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const cookieHeader = req.headers.get('cookie') || '';
  let userId: string | undefined;
  let organizationId: string | undefined;
  let logPath = '/api/llm/execute';
  let requestBody = '';

  try {
    const user = await requireSession(cookieHeader);
    userId = user.id;

    const orgMember = await ensureDefaultOrganization(user, cookieHeader);
    organizationId = String(orgMember.organization_id || '');

    requestBody = await req.text();
    const body = JSON.parse(requestBody) as {
      prompt?: string;
      model?: string;
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
      frequency_penalty?: number;
      presence_penalty?: number;
      stop_sequences?: string[];
      prompt_id?: string;
    };

    const {
      prompt,
      model = 'gpt-3.5-turbo',
      temperature = 0.7,
      max_tokens = 1000,
      top_p = 1,
      frequency_penalty = 0,
      presence_penalty = 0,
      stop_sequences = [],
      prompt_id,
    } = body;

    logPath = buildLogPath(prompt_id);

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const provider = getProvider(model);

    if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured on server' },
        { status: 500 }
      );
    }
    if (provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured on server. Please configure ANTHROPIC_API_KEY.' },
        { status: 500 }
      );
    }
    if (provider === 'cohere' && !process.env.COHERE_API_KEY) {
      return NextResponse.json(
        { error: 'Cohere API key not configured on server. Please configure COHERE_API_KEY.' },
        { status: 500 }
      );
    }

    let result;
    try {
      if (provider === 'openai') {
        result = await executeOpenAI(
          prompt,
          model,
          temperature,
          max_tokens,
          top_p,
          frequency_penalty,
          presence_penalty,
          stop_sequences
        );
      } else if (provider === 'anthropic') {
        result = await executeAnthropic(prompt, model, temperature, max_tokens);
      } else if (provider === 'cohere') {
        result = await executeCohere(prompt, model, temperature, max_tokens);
      } else {
        return NextResponse.json(
          { error: `Unknown provider: ${provider}` },
          { status: 400 }
        );
      }
    } catch (providerError: unknown) {
      const err = providerError as { status?: number; statusCode?: number; message?: string };
      console.error(`${provider} execution error:`, providerError);

      const latency_ms = Date.now() - startTime;
      let statusCode = 500;
      let errorMessage = err.message || 'Provider execution failed';

      if (err.status === 401 || err.statusCode === 401) {
        statusCode = 500;
        errorMessage = `Invalid ${provider} API key`;
      } else if (err.status === 429 || err.statusCode === 429) {
        statusCode = 429;
        errorMessage = 'Rate limit exceeded. Please try again later.';
      }

      await logApiCall(cookieHeader, userId, {
        organization_id: organizationId,
        method: 'POST',
        path: logPath,
        status_code: statusCode,
        response_time_ms: latency_ms,
        request_size_bytes: Buffer.byteLength(requestBody, 'utf8'),
        user_agent: req.headers.get('user-agent') || undefined,
        ip_address: getClientIp(req),
        error_message: errorMessage,
      });

      return NextResponse.json({ error: errorMessage }, { status: statusCode });
    }

    const latency_ms = Date.now() - startTime;
    const cost_cents = calculateCost(
      model,
      result.usage.prompt_tokens,
      result.usage.completion_tokens
    );

    const responsePayload = {
      content: result.content,
      tokens_used: result.usage.total_tokens,
      cost_cents,
      latency_ms,
      model,
      provider,
      usage: result.usage,
    };

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
      tokens_used: result.usage.total_tokens,
      cost_cents,
    });

    return NextResponse.json(responsePayload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to execute LLM request';
    const status = message === 'Unauthorized' ? 401 : 500;
    console.error('LLM execution error:', error);

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
