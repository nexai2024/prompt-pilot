import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { CohereClient } from 'cohere-ai';

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
  // OpenAI
  'gpt-4': { input: 0.03, output: 0.06, provider: 'openai' },
  'gpt-4-turbo': { input: 0.01, output: 0.03, provider: 'openai' },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015, provider: 'openai' },

  // Anthropic Claude
  'claude-3-opus-20240229': { input: 0.015, output: 0.075, provider: 'anthropic' },
  'claude-3-sonnet-20240229': { input: 0.003, output: 0.015, provider: 'anthropic' },
  'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125, provider: 'anthropic' },
  'claude-3-opus': { input: 0.015, output: 0.075, provider: 'anthropic' },
  'claude-3-sonnet': { input: 0.003, output: 0.015, provider: 'anthropic' },
  'claude-3-haiku': { input: 0.00025, output: 0.00125, provider: 'anthropic' },

  // Cohere
  'command': { input: 0.001, output: 0.002, provider: 'cohere' },
  'command-light': { input: 0.0003, output: 0.0006, provider: 'cohere' },
  'command-r': { input: 0.0005, output: 0.0015, provider: 'cohere' },
  'command-r-plus': { input: 0.003, output: 0.015, provider: 'cohere' },
};

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] || { input: 0.001, output: 0.002 };
  const inputCost = (inputTokens / 1000) * pricing.input;
  const outputCost = (outputTokens / 1000) * pricing.output;
  return (inputCost + outputCost) * 100;
}

function getProvider(model: string): string {
  const pricing = MODEL_PRICING[model];
  return pricing?.provider || 'openai';
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
      total_tokens: usage.total_tokens
    }
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
      total_tokens: response.usage.input_tokens + response.usage.output_tokens
    }
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

  // Estimate tokens (Cohere doesn't always return exact counts)
  const estimatedPromptTokens = Math.ceil(prompt.length / 4);
  const estimatedCompletionTokens = Math.ceil((response.text || '').length / 4);

  return {
    content: response.text || '',
    usage: {
      prompt_tokens: estimatedPromptTokens,
      completion_tokens: estimatedCompletionTokens,
      total_tokens: estimatedPromptTokens + estimatedCompletionTokens
    }
  };
}

export async function POST(req: NextRequest) {
  try {
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

    const provider = getProvider(model);
    const startTime = Date.now();

    let result;

    // Check if required API key is configured
    if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured on server' },
        { status: 500 }
      );
    } else if (provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured on server. Please configure ANTHROPIC_API_KEY.' },
        { status: 500 }
      );
    } else if (provider === 'cohere' && !process.env.COHERE_API_KEY) {
      return NextResponse.json(
        { error: 'Cohere API key not configured on server. Please configure COHERE_API_KEY.' },
        { status: 500 }
      );
    }

    // Execute based on provider
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
    } catch (providerError: any) {
      console.error(`${provider} execution error:`, providerError);

      // Handle provider-specific errors
      if (providerError.status === 401 || providerError.statusCode === 401) {
        return NextResponse.json(
          { error: `Invalid ${provider} API key` },
          { status: 500 }
        );
      } else if (providerError.status === 429 || providerError.statusCode === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      throw providerError;
    }

    const latency_ms = Date.now() - startTime;
    const cost_cents = calculateCost(
      model,
      result.usage.prompt_tokens,
      result.usage.completion_tokens
    );

    // Log API call (disabled - no auth/database)

    return NextResponse.json({
      content: result.content,
      tokens_used: result.usage.total_tokens,
      cost_cents,
      latency_ms,
      model,
      provider,
      usage: result.usage
    });
  } catch (error: any) {
    console.error('LLM execution error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to execute LLM request' },
      { status: 500 }
    );
  }
}
