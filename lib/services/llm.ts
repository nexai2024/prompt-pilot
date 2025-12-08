import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true
});

export interface LLMRequest {
  prompt: string;
  model: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop_sequences?: string[];
  streaming?: boolean;
}

export interface LLMResponse {
  content: string;
  tokens_used: number;
  cost_cents: number;
  latency_ms: number;
  model: string;
}

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

export const llmService = {
  async complete(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured. Please add NEXT_PUBLIC_OPENAI_API_KEY to your environment variables.');
      }

      const response = await openai.chat.completions.create({
        model: request.model.includes('gpt') ? request.model : 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: request.prompt }],
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens ?? 1000,
        top_p: request.top_p ?? 1,
        frequency_penalty: request.frequency_penalty ?? 0,
        presence_penalty: request.presence_penalty ?? 0,
        stop: request.stop_sequences,
      });

      const latency_ms = Date.now() - startTime;
      const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      const cost_cents = calculateCost(
        request.model,
        usage.prompt_tokens,
        usage.completion_tokens
      );

      return {
        content: response.choices[0]?.message?.content || '',
        tokens_used: usage.total_tokens,
        cost_cents,
        latency_ms,
        model: request.model
      };
    } catch (error: any) {
      const latency_ms = Date.now() - startTime;

      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your environment configuration.');
      } else if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.status === 500) {
        throw new Error('OpenAI service error. Please try again later.');
      }

      throw new Error(error.message || 'Failed to complete LLM request');
    }
  },

  async completeStream(
    request: LLMRequest,
    onChunk: (chunk: string) => void
  ): Promise<LLMResponse> {
    const startTime = Date.now();
    let fullContent = '';
    let tokensUsed = 0;

    try {
      if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }

      const stream = await openai.chat.completions.create({
        model: request.model.includes('gpt') ? request.model : 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: request.prompt }],
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens ?? 1000,
        top_p: request.top_p ?? 1,
        frequency_penalty: request.frequency_penalty ?? 0,
        presence_penalty: request.presence_penalty ?? 0,
        stop: request.stop_sequences,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          onChunk(content);
        }
      }

      const latency_ms = Date.now() - startTime;
      tokensUsed = Math.ceil(fullContent.length / 4);
      const cost_cents = calculateCost(request.model, request.prompt.length / 4, tokensUsed);

      return {
        content: fullContent,
        tokens_used: tokensUsed,
        cost_cents,
        latency_ms,
        model: request.model
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to complete streaming request');
    }
  },

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  },

  estimateCost(model: string, promptLength: number, maxTokens: number): number {
    const inputTokens = this.estimateTokens(promptLength.toString());
    return calculateCost(model, inputTokens, maxTokens);
  }
};
