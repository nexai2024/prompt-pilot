export const LLM_MODELS = [
  { value: 'gpt-4', label: 'GPT-4', provider: 'OpenAI' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'OpenAI' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus', provider: 'Anthropic' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet', provider: 'Anthropic' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku', provider: 'Anthropic' },
  { value: 'command-r-plus', label: 'Command R+', provider: 'Cohere' },
  { value: 'command-r', label: 'Command R', provider: 'Cohere' },
  { value: 'command', label: 'Command', provider: 'Cohere' },
  { value: 'command-light', label: 'Command Light', provider: 'Cohere' },
] as const;

export type LlmModelValue = (typeof LLM_MODELS)[number]['value'];
