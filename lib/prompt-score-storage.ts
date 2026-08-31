import {
  findByPublicId,
  ncbCreate,
  ncbRead,
  newSupabaseId,
  type NcbRecord,
} from './ncb-server';
import type { PromptScoreResult } from './prompt-assist';

export const SCORE_DIMENSION_KEYS = [
  'clarity',
  'specificity',
  'structure',
  'variables',
  'robustness',
] as const;

export type ScoreDimensionKey = (typeof SCORE_DIMENSION_KEYS)[number];

export interface StoredPromptScore {
  id: string;
  promptId: string;
  overallScore: number;
  clarity: number;
  specificity: number;
  structure: number;
  variables: number;
  robustness: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  createdAt: string;
}

function jsonArray(value: unknown): string {
  return JSON.stringify(Array.isArray(value) ? value : []);
}

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {
        return [];
      }
    }
  }
  return [];
}

function dimensionValue(
  result: PromptScoreResult,
  key: ScoreDimensionKey
): number {
  const labelMap: Record<ScoreDimensionKey, string> = {
    clarity: 'Clarity',
    specificity: 'Specificity',
    structure: 'Structure',
    variables: 'Variables',
    robustness: 'Robustness',
  };
  const dim = result.dimensions.find((d) => d.label === labelMap[key]);
  return dim?.score ?? 0;
}

export function recordToStoredScore(record: NcbRecord): StoredPromptScore {
  return {
    id: String(record.supabase_id || record.id),
    promptId: String(record.prompt_id || ''),
    overallScore: Number(record.overall_score ?? 0),
    clarity: Number(record.clarity ?? 0),
    specificity: Number(record.specificity ?? 0),
    structure: Number(record.structure ?? 0),
    variables: Number(record.variables ?? 0),
    robustness: Number(record.robustness ?? 0),
    summary: String(record.summary || ''),
    strengths: parseJsonArray(record.strengths),
    improvements: parseJsonArray(record.improvements),
    suggestions: parseJsonArray(record.suggestions),
    createdAt: String(record.created_at || ''),
  };
}

export async function savePromptScore(
  cookieHeader: string,
  input: {
    promptPublicId: string;
    organizationId?: string;
    userId: string;
    result: PromptScoreResult;
  }
): Promise<StoredPromptScore | null> {
  try {
    const prompt = await findByPublicId('prompts', cookieHeader, input.promptPublicId);
    if (!prompt) return null;

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const record = await ncbCreate('prompt_scores', cookieHeader, {
      supabase_id: newSupabaseId(),
      prompt_id: input.promptPublicId,
      organization_id: input.organizationId || String(prompt.organization_id || ''),
      user_id: input.userId,
      overall_score: input.result.overall_score,
      clarity: dimensionValue(input.result, 'clarity'),
      specificity: dimensionValue(input.result, 'specificity'),
      structure: dimensionValue(input.result, 'structure'),
      variables: dimensionValue(input.result, 'variables'),
      robustness: dimensionValue(input.result, 'robustness'),
      summary: input.result.summary,
      strengths: jsonArray(input.result.strengths),
      improvements: jsonArray(input.result.improvements),
      suggestions: jsonArray(input.result.suggestions),
      created_at: now,
    });

    return recordToStoredScore(record);
  } catch (error) {
    console.error('Failed to save prompt score:', error);
    return null;
  }
}

export async function listPromptScores(
  cookieHeader: string,
  promptPublicId: string,
  limit = 20
): Promise<StoredPromptScore[]> {
  try {
    const records = await ncbRead('prompt_scores', cookieHeader, {
      prompt_id: promptPublicId,
      sort: 'created_at',
      order: 'asc',
      limit: String(limit),
    });

    return records.map(recordToStoredScore);
  } catch (error) {
    console.error('Failed to list prompt scores:', error);
    return [];
  }
}

export async function listOrganizationScores(
  cookieHeader: string,
  organizationId: string,
  limit = 100
): Promise<StoredPromptScore[]> {
  try {
    const records = await ncbRead('prompt_scores', cookieHeader, {
      organization_id: organizationId,
      sort: 'created_at',
      order: 'desc',
      limit: String(limit),
    });

    return records.map(recordToStoredScore);
  } catch (error) {
    console.error('Failed to list organization scores:', error);
    return [];
  }
}
