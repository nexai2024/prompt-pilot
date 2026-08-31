/** NCB stores api_keys.permissions as a JSON array string, e.g. '["read","write"]'. */

export function parseApiKeyPermissions(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) {
          return parsed.map(String).filter(Boolean);
        }
      } catch {
        // fall through to comma split
      }
    }

    return trimmed
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return [];
}

export function formatApiKeyPermissionsForNcb(
  permissions: string[] = ['read', 'write']
): string {
  return JSON.stringify(permissions);
}

export function apiKeyHasPermission(
  permissions: unknown,
  required: 'read' | 'write'
): boolean {
  const list = parseApiKeyPermissions(permissions);
  return list.includes(required) || list.includes('write');
}
