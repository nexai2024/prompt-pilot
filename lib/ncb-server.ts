import { randomUUID } from 'crypto';
import {
  extractAuthCookies,
  getSessionUser,
  NCB_CONFIG,
  type NcbSessionUser,
} from './ncb-utils';
import { generateVanitySubdomain } from './tenant-domains';

export interface NcbRecord {
  id?: number;
  supabase_id?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

interface NcbApiResponse<T = NcbRecord[]> {
  status?: string;
  data?: T;
  id?: number;
  error?: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

function ncbHeaders(cookieHeader: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Database-Instance': NCB_CONFIG.instance,
    Authorization: `Bearer ${NCB_CONFIG.secretKey}`,
    Cookie: extractAuthCookies(cookieHeader),
  };
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const searchParams = new URLSearchParams({ instance: NCB_CONFIG.instance });
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') searchParams.set(key, value);
    }
  }
  return `${NCB_CONFIG.dataApiUrl}/${path}?${searchParams.toString()}`;
}

async function parseResponse<T>(res: Response): Promise<NcbApiResponse<T>> {
  const text = await res.text();
  if (!text) {
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return {};
  }

  try {
    const parsed = JSON.parse(text) as NcbApiResponse<T>;
    if (!res.ok) {
      throw new Error(parsed.error || parsed.message || `Request failed (${res.status})`);
    }
    return parsed;
  } catch (error) {
    if (error instanceof Error && !error.message.includes('JSON') && !error.message.includes('Unexpected token')) {
      throw error;
    }
    if (!res.ok) {
      throw new Error(
        text.includes('<!DOCTYPE')
          ? `Request failed (${res.status}): invalid API response`
          : text || `Request failed (${res.status})`
      );
    }
    return {};
  }
}

export async function requireSession(
  cookieHeader: string
): Promise<NcbSessionUser> {
  const user = await getSessionUser(cookieHeader);
  if (!user) throw new Error('Unauthorized');
  return user;
}

export function toPublicId(record: NcbRecord): string {
  if (record.supabase_id) return String(record.supabase_id);
  if (record.id !== undefined) return String(record.id);
  return '';
}

export function toPublicRecord<T extends NcbRecord>(
  record: T
): T & { id: string } {
  const boolFields = [
    'streaming',
    'content_filtering',
    'caching',
    'required',
    'locked',
    'populated',
    'is_starred',
  ];

  const mapped: Record<string, unknown> = {
    ...record,
    id: toPublicId(record),
  };

  for (const field of boolFields) {
    if (field in mapped && typeof mapped[field] === 'number') {
      mapped[field] = mapped[field] === 1;
    }
  }

  return mapped as T & { id: string };
}

export function toPublicRecords<T extends NcbRecord>(records: T[]): Array<T & { id: string }> {
  return records.map((record) => toPublicRecord(record));
}

export async function ncbRead<T extends NcbRecord = NcbRecord>(
  table: string,
  cookieHeader: string,
  params?: Record<string, string>
): Promise<T[]> {
  const res = await fetch(buildUrl(`read/${table}`, params), {
    method: 'GET',
    headers: ncbHeaders(cookieHeader),
    cache: 'no-store',
  });

  const parsed = await parseResponse<T[]>(res);
  return parsed.data || [];
}

export async function ncbReadOne<T extends NcbRecord = NcbRecord>(
  table: string,
  cookieHeader: string,
  params: Record<string, string>
): Promise<T | null> {
  const records = await ncbRead<T>(table, cookieHeader, params);
  return records[0] ?? null;
}

export async function ncbCreate<T extends NcbRecord = NcbRecord>(
  table: string,
  cookieHeader: string,
  payload: Record<string, unknown>
): Promise<T> {
  const res = await fetch(buildUrl(`create/${table}`), {
    method: 'POST',
    headers: ncbHeaders(cookieHeader),
    body: JSON.stringify(payload),
  });

  const parsed = await parseResponse<T | T[]>(res);

  if (parsed.data) {
    if (Array.isArray(parsed.data)) return parsed.data[0] as T;
    return parsed.data as T;
  }

  // NCB create responses return { status, message, id } without a data array
  if (parsed.id !== undefined) {
    return { ...payload, id: parsed.id } as T;
  }

  if (parsed.status === 'success') {
    return payload as T;
  }

  throw new Error(parsed.error || parsed.message || 'Create failed');
}

export async function ncbUpdate<T extends NcbRecord = NcbRecord>(
  table: string,
  cookieHeader: string,
  ncbId: number,
  payload: Record<string, unknown>
): Promise<T> {
  const res = await fetch(buildUrl(`update/${table}/${ncbId}`), {
    method: 'PUT',
    headers: ncbHeaders(cookieHeader),
    body: JSON.stringify(payload),
  });

  const parsed = await parseResponse<T | T[]>(res);

  if (parsed.data) {
    if (Array.isArray(parsed.data)) return parsed.data[0] as T;
    return parsed.data as T;
  }

  // Updates often return only status/message — merge payload with known id
  if (parsed.status === 'success' || res.ok) {
    return { ...payload, id: ncbId } as T;
  }

  throw new Error(parsed.error || parsed.message || 'Update failed');
}

export async function ncbDelete(
  table: string,
  cookieHeader: string,
  ncbId: number
): Promise<void> {
  const res = await fetch(buildUrl(`delete/${table}/${ncbId}`), {
    method: 'DELETE',
    headers: ncbHeaders(cookieHeader),
  });

  await parseResponse(res);
}

export async function findByPublicId<T extends NcbRecord = NcbRecord>(
  table: string,
  cookieHeader: string,
  publicId: string
): Promise<T | null> {
  return ncbReadOne<T>(table, cookieHeader, { supabase_id: publicId });
}

export function boolToInt(value: boolean | undefined): number | undefined {
  if (value === undefined) return undefined;
  return value ? 1 : 0;
}

export function newSupabaseId(): string {
  return randomUUID();
}

export async function getOrganizationMember(
  userId: string,
  cookieHeader: string
) {
  return ncbReadOne('organization_members', cookieHeader, { user_id: userId });
}

export async function getOrganizationByPublicId(
  orgPublicId: string,
  cookieHeader: string
) {
  return findByPublicId('organizations', cookieHeader, orgPublicId);
}

export async function getOrganizationByVanitySubdomain(
  vanitySubdomain: string,
  cookieHeader = ''
) {
  return ncbReadOne('organizations', cookieHeader, {
    vanity_subdomain: vanitySubdomain,
  });
}

export async function getOrganizationByCustomDomain(
  customDomain: string,
  cookieHeader = ''
) {
  return ncbReadOne('organizations', cookieHeader, {
    custom_domain: customDomain,
  });
}

export async function ensureOrganizationVanitySubdomain(
  orgPublicId: string,
  cookieHeader: string,
  seed?: string
): Promise<string> {
  const org = await findByPublicId('organizations', cookieHeader, orgPublicId);
  if (!org) throw new Error('Organization not found');

  const existing = org.vanity_subdomain ? String(org.vanity_subdomain) : '';
  if (existing) return existing;

  const vanitySubdomain = generateVanitySubdomain(
    seed || String(org.slug || orgPublicId)
  );
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  if (org.id !== undefined) {
    await ncbUpdate('organizations', cookieHeader, org.id, {
      vanity_subdomain: vanitySubdomain,
      updated_at: now,
    });
  }

  return vanitySubdomain;
}

export async function ensureDefaultOrganization(
  user: NcbSessionUser,
  cookieHeader: string
) {
  const existing = await getOrganizationMember(user.id, cookieHeader);
  if (existing) return existing;

  const firstName = user.name?.split(' ')[0] || 'Personal';
  const orgSupabaseId = randomUUID();
  const slug = `personal-${user.id.slice(0, 8)}-${Date.now()}`;
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const organization = await ncbCreate('organizations', cookieHeader, {
    supabase_id: orgSupabaseId,
    name: `${firstName}'s Organization`,
    slug,
    vanity_subdomain: generateVanitySubdomain(slug),
    created_by: user.id,
    created_at: now,
    updated_at: now,
    user_id: user.id,
  });

  const member = await ncbCreate('organization_members', cookieHeader, {
    supabase_id: randomUUID(),
    organization_id: toPublicId(organization),
    original_user_id: user.id,
    role: 'owner',
    joined_at: now,
    user_id: user.id,
  });

  return member;
}

export async function resolveNcbId(
  table: string,
  cookieHeader: string,
  publicId: string
): Promise<number | null> {
  const record = await findByPublicId(table, cookieHeader, publicId);
  return record?.id ?? null;
}

export interface ApiCallLogInput {
  organization_id?: string;
  deployment_id?: string;
  method: string;
  path: string;
  status_code: number;
  response_time_ms: number;
  request_size_bytes?: number;
  response_size_bytes?: number;
  user_agent?: string;
  ip_address?: string;
  error_message?: string;
  tokens_used?: number;
  cost_cents?: number;
}

export async function logApiCall(
  cookieHeader: string,
  userId: string,
  input: ApiCallLogInput
): Promise<void> {
  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await ncbCreate('api_calls', cookieHeader, {
      supabase_id: newSupabaseId(),
      organization_id: input.organization_id || null,
      deployment_id: input.deployment_id || null,
      method: input.method,
      path: input.path,
      status_code: input.status_code,
      response_time_ms: input.response_time_ms,
      request_size_bytes: input.request_size_bytes ?? null,
      response_size_bytes: input.response_size_bytes ?? null,
      user_agent: input.user_agent || null,
      ip_address: input.ip_address || null,
      error_message: input.error_message || null,
      tokens_used: input.tokens_used ?? null,
      cost_cents: input.cost_cents ?? null,
      created_at: now,
      user_id: userId,
    });
  } catch (error) {
    console.error('Failed to log API call:', error);
  }
}
