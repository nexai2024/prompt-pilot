export const PROMPT_ENGINEER_SYSTEM = `You are an expert prompt engineer for production LLM applications.

When writing or improving prompts, follow these best practices:
- Assign a clear role and objective at the start
- Be specific about task, audience, and desired output format
- Use {{variable_name}} placeholders for dynamic user-provided values (snake_case names only)
- Include constraints, quality criteria, and edge-case handling when relevant
- Prefer structured sections (Context, Task, Requirements, Output format) for complex prompts
- Avoid vague instructions; use actionable language
- Do not wrap the prompt in markdown code fences or add meta-commentary outside the JSON schema requested

Return ONLY valid JSON matching the schema described in the user message.`;

export const GENERATE_USER_TEMPLATE = (params: {
  description: string;
  useCase?: string;
  tone?: string;
  outputFormat?: string;
}) => `Create a production-ready LLM prompt based on this description:

"${params.description}"
${params.useCase ? `\nUse case: ${params.useCase}` : ''}
${params.tone ? `\nTone: ${params.tone}` : ''}
${params.outputFormat ? `\nPreferred output format: ${params.outputFormat}` : ''}

Return JSON with this exact shape:
{
  "prompt": "the full prompt text with {{variables}} where needed",
  "suggested_name": "short descriptive name",
  "suggested_description": "one sentence describing what the prompt does",
  "variables": [
    { "name": "variable_name", "description": "what this variable represents", "required": true }
  ],
  "tips": ["1-2 brief tips for using this prompt effectively"]
}`;

export const ENHANCE_USER_TEMPLATE = (params: {
  prompt: string;
  goals?: string;
}) => `Improve this LLM prompt using prompt-engineering best practices. Preserve the author's intent and any existing {{variables}} (you may rename variables only if it improves clarity).

Current prompt:
"""
${params.prompt}
"""
${params.goals ? `\nEnhancement goals: ${params.goals}` : ''}

Return JSON with this exact shape:
{
  "prompt": "the improved full prompt text",
  "improvements": ["bullet list of specific improvements made"],
  "variables": [
    { "name": "variable_name", "description": "what this variable represents", "required": true }
  ]
}`;

export const SCORE_USER_TEMPLATE = (params: {
  prompt: string;
  name?: string;
  description?: string;
}) => `Evaluate this LLM prompt for production readiness. Be constructive and specific — praise what works and explain how to improve weaknesses.

Prompt name: ${params.name || 'Untitled'}
${params.description ? `Description: ${params.description}` : ''}

Prompt text:
"""
${params.prompt}
"""

Score each dimension 0–100:
- clarity: Is the task and role unambiguous?
- specificity: Are requirements, constraints, and output format concrete?
- structure: Is the prompt well-organized and scannable?
- variables: Are {{placeholders}} used appropriately and consistently?
- robustness: Does it handle edge cases, ambiguity, and failure modes?

Return JSON with this exact shape:
{
  "overall_score": 0,
  "dimensions": {
    "clarity": 0,
    "specificity": 0,
    "structure": 0,
    "variables": 0,
    "robustness": 0
  },
  "summary": "2-3 sentence overall assessment",
  "strengths": ["specific things done well"],
  "improvements": ["specific constructive criticism with actionable fixes"],
  "suggestions": ["concrete rewrite or addition suggestions, one per item"]
}`;

export interface PromptScoreDimension {
  label: string;
  score: number;
  color: string;
}

export interface PromptScoreResult {
  overall_score: number;
  dimensions: PromptScoreDimension[];
  summary: string;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
}

const SCORE_DIMENSION_META: Array<{ key: string; label: string; color: string }> = [
  { key: 'clarity', label: 'Clarity', color: '#3a80ff' },
  { key: 'specificity', label: 'Specificity', color: '#6366f1' },
  { key: 'structure', label: 'Structure', color: '#8b5cf6' },
  { key: 'variables', label: 'Variables', color: '#22e8f5' },
  { key: 'robustness', label: 'Robustness', color: '#10b981' },
];

export function normalizeScoreResult(raw: Record<string, unknown>): PromptScoreResult {
  const dimsRaw = (raw.dimensions || {}) as Record<string, unknown>;
  const dimensions: PromptScoreDimension[] = SCORE_DIMENSION_META.map((meta) => ({
    label: meta.label,
    score: Math.min(100, Math.max(0, Number(dimsRaw[meta.key] ?? 0))),
    color: meta.color,
  }));

  const overallFromDims =
    dimensions.length > 0
      ? Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length)
      : 0;

  const overall_score = Math.min(
    100,
    Math.max(0, Number(raw.overall_score ?? raw.overallScore ?? overallFromDims))
  );

  return {
    overall_score,
    dimensions,
    summary: String(raw.summary || raw.assessment || ''),
    strengths: Array.isArray(raw.strengths) ? raw.strengths.map(String) : [],
    improvements: Array.isArray(raw.improvements)
      ? raw.improvements.map(String)
      : Array.isArray(raw.weaknesses)
        ? (raw.weaknesses as unknown[]).map(String)
        : [],
    suggestions: Array.isArray(raw.suggestions)
      ? raw.suggestions.map(String)
      : Array.isArray(raw.recommendations)
        ? (raw.recommendations as unknown[]).map(String)
        : [],
  };
}

export interface GeneratedPromptResult {
  prompt: string;
  suggested_name: string;
  suggested_description: string;
  variables: Array<{ name: string; description: string; required: boolean }>;
  tips?: string[];
}

export interface EnhancedPromptResult {
  prompt: string;
  improvements: string[];
  variables: Array<{ name: string; description: string; required: boolean }>;
}

export function normalizeGeneratedResult(raw: Record<string, unknown>): GeneratedPromptResult {
  const variables = Array.isArray(raw.variables)
    ? raw.variables.map((v) => {
        const item = v as Record<string, unknown>;
        return {
          name: String(item.name || ''),
          description: String(item.description || ''),
          required: item.required !== false,
        };
      }).filter((v) => v.name)
    : [];

  return {
    prompt: String(raw.prompt || raw.generated_prompt || raw.prompt_text || ''),
    suggested_name: String(
      raw.suggested_name || raw.suggestedName || raw.name || 'Untitled Prompt'
    ),
    suggested_description: String(
      raw.suggested_description || raw.suggestedDescription || raw.description || ''
    ),
    variables,
    tips: Array.isArray(raw.tips) ? raw.tips.map(String) : undefined,
  };
}

export function normalizeEnhancedResult(raw: Record<string, unknown>): EnhancedPromptResult {
  const variables = Array.isArray(raw.variables)
    ? raw.variables.map((v) => {
        const item = v as Record<string, unknown>;
        return {
          name: String(item.name || ''),
          description: String(item.description || ''),
          required: item.required !== false,
        };
      }).filter((v) => v.name)
    : [];

  const improvements = Array.isArray(raw.improvements)
    ? raw.improvements.map(String)
    : Array.isArray(raw.changes)
      ? (raw.changes as unknown[]).map(String)
      : [];

  return {
    prompt: String(raw.prompt || raw.enhanced_prompt || raw.prompt_text || ''),
    improvements,
    variables,
  };
}

export function parseAssistJson<T>(raw: string): T {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI returned an invalid response format');
  }
  return JSON.parse(jsonMatch[0]) as T;
}
