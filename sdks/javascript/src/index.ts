/**
 * Prompt Pilot JavaScript/TypeScript SDK
 * Official client library for interacting with the Prompt Pilot API
 */

export interface PromptPilotConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
}

export interface ExecutePromptRequest {
  promptId: string;
  variables?: Record<string, any>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface PromptResponse {
  content: string;
  tokensUsed: number;
  costCents: number;
  costDollars: number;
  latencyMs: number;
  model: string;
  provider: string;
  raw: any;
}

export interface Prompt {
  id: string;
  name: string;
  content: string;
  description?: string;
  model: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export class PromptPilotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PromptPilotError';
  }
}

export class AuthenticationError extends PromptPilotError {
  constructor(message: string = 'Invalid API key') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends PromptPilotError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

class PromptsResource {
  constructor(private client: PromptPilot) {}

  /**
   * Execute a prompt with variables
   */
  async execute(request: ExecutePromptRequest): Promise<PromptResponse> {
    const payload: any = {
      prompt_id: request.promptId,
      variables: request.variables || {},
    };

    if (request.model) payload.model = request.model;
    if (request.temperature !== undefined) payload.temperature = request.temperature;
    if (request.maxTokens) payload.max_tokens = request.maxTokens;

    const response = await this.client.request('POST', '/api/prompts/execute', payload);

    return {
      content: response.content,
      tokensUsed: response.tokens_used,
      costCents: response.cost_cents,
      costDollars: response.cost_cents / 100,
      latencyMs: response.latency_ms,
      model: response.model,
      provider: response.provider,
      raw: response,
    };
  }

  /**
   * List all prompts for an organization
   */
  async list(organizationId: string): Promise<Prompt[]> {
    const response = await this.client.request(
      'GET',
      `/api/prompts?organizationId=${organizationId}`
    );
    return response.prompts || [];
  }

  /**
   * Get a specific prompt
   */
  async get(promptId: string): Promise<Prompt> {
    const response = await this.client.request('GET', `/api/prompts/${promptId}`);
    return response.prompt;
  }

  /**
   * Create a new prompt
   */
  async create(data: {
    organizationId: string;
    name: string;
    content: string;
    description?: string;
    model?: string;
    [key: string]: any;
  }): Promise<Prompt> {
    const payload = {
      organization_id: data.organizationId,
      name: data.name,
      content: data.content,
      description: data.description,
      model: data.model || 'gpt-4',
    };

    const response = await this.client.request('POST', '/api/prompts', payload);
    return response.prompt;
  }

  /**
   * Update a prompt
   */
  async update(promptId: string, data: Partial<Prompt>): Promise<Prompt> {
    const response = await this.client.request('PUT', `/api/prompts/${promptId}`, data);
    return response.prompt;
  }

  /**
   * Delete a prompt
   */
  async delete(promptId: string): Promise<void> {
    await this.client.request('DELETE', `/api/prompts/${promptId}`);
  }
}

export class PromptPilot {
  private apiKey: string;
  private baseURL: string;
  private timeout: number;

  public prompts: PromptsResource;

  constructor(config: PromptPilotConfig) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://your-domain.com';
    this.timeout = config.timeout || 30000;

    this.prompts = new PromptsResource(this);
  }

  /**
   * Make an HTTP request to the API
   */
  async request(method: string, path: string, body?: any): Promise<any> {
    const url = `${this.baseURL}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'promptpilot-js/0.1.0',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle errors
      if (response.status === 401) {
        throw new AuthenticationError('Invalid API key');
      } else if (response.status === 429) {
        throw new RateLimitError('Rate limit exceeded');
      } else if (response.status >= 400) {
        const errorData = await response.json().catch(() => ({}));
        throw new PromptPilotError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new PromptPilotError('Request timeout');
      }

      throw error;
    }
  }
}

// Default export
export default PromptPilot;
