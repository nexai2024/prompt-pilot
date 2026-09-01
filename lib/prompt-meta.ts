export function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }
  if (typeof value !== 'string' || !value.trim()) return [];
  return value
    .split(/[,#]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function encodeTags(tags: string[]): string {
  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean))).join(',');
}

export function parseFixtures(value: unknown): Record<string, string> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      String(entry ?? ''),
    ]);
    return Object.fromEntries(entries);
  }
  if (typeof value !== 'string' || !value.trim()) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      if ('variables' in parsed && parsed.variables && typeof parsed.variables === 'object') {
        return parseFixtures(parsed.variables);
      }
      return parseFixtures(parsed);
    }
  } catch {
    return {};
  }
  return {};
}

export function encodeFixtures(variables: Record<string, string>): string {
  return JSON.stringify({ variables });
}
