import { createHash, randomBytes } from 'crypto';
import { apiKeyHasPermission } from './api-key-utils';
import { ncbRead, ncbUpdate, type NcbRecord } from './ncb-server';

const API_KEY_PREFIX = 'pp_live_';

export function generateApiKey(): {
  fullKey: string;
  prefix: string;
  hash: string;
} {
  const secret = randomBytes(24).toString('hex');
  const fullKey = `${API_KEY_PREFIX}${secret}`;
  const prefix = fullKey.slice(0, 16);
  const hash = hashApiKey(fullKey);
  return { fullKey, prefix, hash };
}

export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

export function extractApiKeyFromRequest(headers: Headers): string | null {
  const authorization = headers.get('authorization');
  if (authorization?.startsWith('Bearer ')) {
    const token = authorization.slice(7).trim();
    if (token) return token;
  }

  const apiKeyHeader = headers.get('x-api-key');
  if (apiKeyHeader?.trim()) return apiKeyHeader.trim();

  return null;
}

function isKeyActive(record: NcbRecord): boolean {
  if (record.is_active === 0 || record.is_active === false) return false;
  if (record.expires_at) {
    const expiresAt = new Date(String(record.expires_at));
    if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < Date.now()) {
      return false;
    }
  }
  return true;
}

export async function verifyApiKeyForOrganization(
  apiKey: string,
  organizationId: string,
  requiredPermission: 'read' | 'write' = 'read'
): Promise<NcbRecord | null> {
  if (!apiKey.startsWith(API_KEY_PREFIX)) return null;

  const prefix = apiKey.slice(0, 16);
  const hash = hashApiKey(apiKey);

  const candidates = await ncbRead('api_keys', '', {
    organization_id: organizationId,
    key_prefix: prefix,
  });

  const match = candidates.find(
    (record) =>
      String(record.key_hash) === hash &&
      isKeyActive(record) &&
      apiKeyHasPermission(record.permissions, requiredPermission)
  );

  return match ?? null;
}

export async function touchApiKeyLastUsed(
  record: NcbRecord,
  cookieHeader = ''
): Promise<void> {
  if (record.id === undefined) return;

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  await ncbUpdate('api_keys', cookieHeader, record.id, {
    last_used_at: now,
  });
}
