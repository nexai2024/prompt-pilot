import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },
};

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] || { input: 0.001, output: 0.002 };
  const inputCost = (inputTokens / 1000) * pricing.input;
  const outputCost = (outputTokens / 1000) * pricing.output;
  return (inputCost + outputCost) * 100;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured on server' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      prompt,
      model = 'gpt-3.5-turbo',
      temperature = 0.7,
      max_tokens = 1000,
      top_p = 1,
      frequency_penalty = 0,
      presence_penalty = 0,
      stop_sequences = []
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const startTime = Date.now();

    const response = await openai.chat.completions.create({
      model: model.includes('gpt') ? model : 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens,
      top_p,
      frequency_penalty,
      presence_penalty,
      stop: stop_sequences.length > 0 ? stop_sequences : undefined,
    });

    const latency_ms = Date.now() - startTime;
    const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    const cost_cents = calculateCost(model, usage.prompt_tokens, usage.completion_tokens);

    return NextResponse.json({
      content: response.choices[0]?.message?.content || '',
      tokens_used: usage.total_tokens,
      cost_cents,
      latency_ms,
      model,
      usage: {
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens
      }
    });
  } catch (error: any) {
    console.error('LLM execution error:', error);

    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key' },
        { status: 500 }
      );
    } else if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    } else if (error.status === 500) {
      return NextResponse.json(
        { error: 'OpenAI service error. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to execute LLM request' },
      { status: 500 }
    );
  }
}
