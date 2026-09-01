import {
  findByPublicId,
  ncbCreate,
  ncbDelete,
  ncbRead,
  ncbUpdate,
  newSupabaseId,
  toPublicRecord,
  type NcbRecord,
} from './ncb-server';

export type VersionLane = 'dev' | 'prod' | 'shelf' | 'snapshot';

export interface PromptVariableInput {
  name: string;
  type?: string;
  description?: string;
  default_value?: string;
  value?: string;
  required?: boolean;
}

export interface PromptVersionRecord extends NcbRecord {
  prompt_id?: string;
  version_number?: number;
  content?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  lane?: string;
  locked?: number | boolean;
  populated?: number | boolean;
  response_format?: string;
  variables_json?: string;
  changelog?: string;
  created_by?: string;
}

export interface VersionLanes {
  dev: PromptVersionRecord;
  prod: PromptVersionRecord;
  shelf: PromptVersionRecord | null;
  snapshots: PromptVersionRecord[];
}

export interface StructurePayload {
  variables: PromptVariableInput[];
  responseFormat: string;
  ioSchema: string;
}

const SYSTEM_LANES: VersionLane[] = ['dev', 'prod', 'shelf'];

function nowSql(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function requireNcbId(record: NcbRecord, label: string): number {
  if (typeof record.id !== 'number') {
    throw new Error(`${label} is missing a database id`);
  }
  return record.id;
}

export function parseLane(value: unknown): VersionLane {
  if (value === 'dev' || value === 'prod' || value === 'shelf' || value === 'snapshot') {
    return value;
  }
  return 'snapshot';
}

export function isSystemLane(lane: VersionLane): boolean {
  return SYSTEM_LANES.includes(lane);
}

export function isLockedLane(lane: VersionLane): boolean {
  return lane !== 'dev';
}

export function isProdPopulated(record: PromptVersionRecord | null | undefined): boolean {
  if (!record) return false;
  if (parseLane(record.lane) !== 'prod') return Boolean(String(record.content || '').trim());
  if (record.populated === 0 || record.populated === false) return false;
  return String(record.content || '').trim().length > 0;
}

export function structureSignature(input: StructurePayload): string {
  const vars = input.variables
    .filter((variable) => variable.name?.trim())
    .map(
      (variable) =>
        `${variable.name.trim().toLowerCase()}:${variable.type || 'string'}:${variable.required ? 1 : 0}`
    )
    .sort()
    .join(',');
  return `${input.responseFormat || 'text'}|${vars}|${input.ioSchema || ''}`;
}

export function encodeStructure(input: StructurePayload): string {
  return JSON.stringify({
    variables: input.variables
      .filter((variable) => variable.name?.trim())
      .map((variable) => ({
        name: variable.name.trim(),
        type: variable.type || 'string',
        required: Boolean(variable.required),
      })),
    response_format: input.responseFormat || 'text',
    io_schema: input.ioSchema || '',
    signature: structureSignature(input),
  });
}

export function decodeStructure(raw: unknown): StructurePayload {
  if (typeof raw !== 'string' || !raw.trim()) {
    return { variables: [], responseFormat: 'text', ioSchema: '' };
  }
  try {
    const parsed = JSON.parse(raw) as {
      variables?: PromptVariableInput[];
      response_format?: string;
      io_schema?: string;
    };
    return {
      variables: Array.isArray(parsed.variables) ? parsed.variables : [],
      responseFormat: parsed.response_format || 'text',
      ioSchema: parsed.io_schema || '',
    };
  } catch {
    return { variables: [], responseFormat: 'text', ioSchema: '' };
  }
}

function versionFields(record: PromptVersionRecord): {
  content: string;
  model: string;
  temperature: number;
  max_tokens: number;
  response_format: string;
  variables_json: string;
} {
  return {
    content: String(record.content || ''),
    model: String(record.model || 'gpt-4'),
    temperature: Number(record.temperature ?? 0.7),
    max_tokens: Number(record.max_tokens ?? 150),
    response_format: String(record.response_format || 'text'),
    variables_json: String(record.variables_json || ''),
  };
}

async function createVersionRow(
  cookieHeader: string,
  payload: Record<string, unknown>
): Promise<PromptVersionRecord> {
  const supabaseId = newSupabaseId();
  const created = await ncbCreate<PromptVersionRecord>('prompt_versions', cookieHeader, {
    supabase_id: supabaseId,
    ...payload,
  });
  if (typeof created.id === 'number') return created;
  const found = await findByPublicId<PromptVersionRecord>(
    'prompt_versions',
    cookieHeader,
    supabaseId
  );
  if (!found) throw new Error('Version created but could not be loaded');
  return found;
}

export async function listPromptVersions(
  cookieHeader: string,
  promptId: string
): Promise<PromptVersionRecord[]> {
  return ncbRead<PromptVersionRecord>('prompt_versions', cookieHeader, {
    prompt_id: promptId,
  });
}

function nextSnapshotNumber(versions: PromptVersionRecord[]): number {
  const numbers = versions.map((version) => Number(version.version_number || 0));
  const max = numbers.reduce((highest, value) => (value > highest ? value : highest), 0);
  return Math.max(max, 0) + 1;
}

export async function ioSignatureForPrompt(
  cookieHeader: string,
  promptId: string
): Promise<string> {
  const endpoints = await ncbRead('api_endpoints', cookieHeader, {
    prompt_id: promptId,
  });
  const parts: string[] = [];

  for (const endpoint of endpoints) {
    const endpointId = String(endpoint.supabase_id || '');
    if (!endpointId) continue;
    const fields = await ncbRead('endpoint_fields', cookieHeader, {
      endpoint_id: endpointId,
    });
    const encoded = fields
      .map(
        (field) =>
          `${field.field_type || ''}:${field.name || ''}:${field.data_type || 'string'}:${
            field.required === 1 || field.required === true ? 1 : 0
          }`
      )
      .sort()
      .join(',');
    parts.push(`${endpointId}[${encoded}]`);
  }

  return parts.sort().join(';');
}

export async function listPromptVariables(
  cookieHeader: string,
  promptId: string
): Promise<PromptVariableInput[]> {
  const rows = await ncbRead('prompt_variables', cookieHeader, { prompt_id: promptId });
  return rows
    .filter((row) => typeof row.name === 'string' && row.name.trim())
    .map((row) => ({
      name: String(row.name),
      type: typeof row.type === 'string' ? row.type : 'string',
      description: typeof row.description === 'string' ? row.description : '',
      default_value: typeof row.default_value === 'string' ? row.default_value : '',
      required: row.required === 1 || row.required === true,
    }));
}

export async function replacePromptVariables(
  cookieHeader: string,
  userId: string,
  promptId: string,
  variables: PromptVariableInput[]
): Promise<void> {
  const existing = await ncbRead('prompt_variables', cookieHeader, { prompt_id: promptId });
  for (const row of existing) {
    if (typeof row.id === 'number') {
      await ncbDelete('prompt_variables', cookieHeader, row.id);
    }
  }

  const now = nowSql();
  for (const variable of variables) {
    if (!variable.name?.trim()) continue;
    await ncbCreate('prompt_variables', cookieHeader, {
      supabase_id: newSupabaseId(),
      prompt_id: promptId,
      name: variable.name.trim(),
      type: variable.type || 'string',
      description: variable.description || null,
      default_value: variable.default_value || variable.value || null,
      required: variable.required ? 1 : 0,
      created_at: now,
      user_id: userId,
    });
  }
}

async function currentStructure(
  cookieHeader: string,
  promptId: string,
  responseFormat: string,
  variables?: PromptVariableInput[]
): Promise<StructurePayload> {
  const resolvedVariables = variables ?? (await listPromptVariables(cookieHeader, promptId));
  return {
    variables: resolvedVariables,
    responseFormat: responseFormat || 'text',
    ioSchema: await ioSignatureForPrompt(cookieHeader, promptId),
  };
}

async function syncPromptRow(
  cookieHeader: string,
  prompt: NcbRecord,
  version: PromptVersionRecord
): Promise<void> {
  await ncbUpdate('prompts', cookieHeader, requireNcbId(prompt, 'Prompt'), {
    content: version.content,
    model: version.model,
    temperature: version.temperature,
    max_tokens: version.max_tokens,
    response_format: version.response_format || 'text',
    updated_at: nowSql(),
  });
}

async function snapshotFrom(
  cookieHeader: string,
  userId: string,
  promptId: string,
  source: PromptVersionRecord,
  versions: PromptVersionRecord[]
): Promise<PromptVersionRecord> {
  const fields = versionFields(source);
  return createVersionRow(cookieHeader, {
    prompt_id: promptId,
    version_number: nextSnapshotNumber(versions),
    ...fields,
    lane: 'snapshot',
    locked: 1,
    populated: 1,
    created_by: userId,
    created_at: nowSql(),
    user_id: userId,
  });
}

export async function ensureSystemLanes(
  cookieHeader: string,
  userId: string,
  prompt: NcbRecord
): Promise<VersionLanes> {
  const promptId = String(prompt.supabase_id || prompt.id || '');
  if (!promptId) throw new Error('Prompt is missing a public id');

  let versions = await listPromptVersions(cookieHeader, promptId);
  const byLane = (lane: VersionLane) =>
    versions.filter((version) => parseLane(version.lane) === lane);

  let dev = byLane('dev').sort(
    (a, b) => Number(b.version_number || 0) - Number(a.version_number || 0)
  )[0];
  let prod = byLane('prod')[0];
  const extras = byLane('dev').slice(1);

  for (const extra of extras) {
    if (typeof extra.id === 'number') {
      await ncbUpdate('prompt_versions', cookieHeader, extra.id, {
        lane: 'snapshot',
        locked: 1,
      });
    }
  }

  const structure = await currentStructure(
    cookieHeader,
    promptId,
    String(prompt.response_format || 'text')
  );

  if (!dev) {
    dev = await createVersionRow(cookieHeader, {
      prompt_id: promptId,
      version_number: nextSnapshotNumber(versions),
      content: String(prompt.content || ''),
      model: String(prompt.model || 'gpt-4'),
      temperature: Number(prompt.temperature ?? 0.7),
      max_tokens: Number(prompt.max_tokens ?? 150),
      response_format: structure.responseFormat,
      variables_json: encodeStructure(structure),
      lane: 'dev',
      locked: 0,
      populated: 1,
      created_by: userId,
      created_at: nowSql(),
      user_id: userId,
    });
    versions = [...versions, dev];
  } else if (typeof dev.id === 'number' && (dev.locked === 1 || dev.locked === true)) {
    await ncbUpdate('prompt_versions', cookieHeader, dev.id, { locked: 0 });
    dev = { ...dev, locked: 0 };
  }

  if (!prod) {
    prod = await createVersionRow(cookieHeader, {
      prompt_id: promptId,
      version_number: 0,
      content: '',
      model: String(prompt.model || 'gpt-4'),
      temperature: Number(prompt.temperature ?? 0.7),
      max_tokens: Number(prompt.max_tokens ?? 150),
      response_format: structure.responseFormat,
      variables_json: encodeStructure({
        variables: [],
        responseFormat: structure.responseFormat,
        ioSchema: '',
      }),
      lane: 'prod',
      locked: 1,
      populated: 0,
      created_by: userId,
      created_at: nowSql(),
      user_id: userId,
    });
    versions = [...versions, prod];
  } else if (typeof prod.id === 'number' && (prod.locked === 0 || prod.locked === false)) {
    await ncbUpdate('prompt_versions', cookieHeader, prod.id, { locked: 1 });
    prod = { ...prod, locked: 1 };
  }

  versions = await listPromptVersions(cookieHeader, promptId);
  const shelf =
    versions.find((version) => parseLane(version.lane) === 'shelf') ?? null;
  const snapshots = versions
    .filter((version) => parseLane(version.lane) === 'snapshot')
    .sort((a, b) => Number(b.version_number || 0) - Number(a.version_number || 0));
  const latestDev =
    versions.find((version) => parseLane(version.lane) === 'dev') ?? dev;
  const latestProd =
    versions.find((version) => parseLane(version.lane) === 'prod') ?? prod;

  return { dev: latestDev, prod: latestProd, shelf, snapshots };
}

export async function saveWorkingCopy(
  cookieHeader: string,
  userId: string,
  prompt: NcbRecord,
  input: {
    content: string;
    model: string;
    temperature: number;
    max_tokens: number;
    response_format?: string;
    variables?: PromptVariableInput[];
  }
): Promise<{ snapshotCreated: boolean; lanes: VersionLanes }> {
  const promptId = String(prompt.supabase_id || prompt.id || '');
  const lanes = await ensureSystemLanes(cookieHeader, userId, prompt);
  const incoming = await currentStructure(
    cookieHeader,
    promptId,
    input.response_format || String(prompt.response_format || 'text'),
    input.variables
  );
  const previous = decodeStructure(lanes.dev.variables_json);
  const previousSig = structureSignature(previous);
  const incomingSig = structureSignature(incoming);
  const structureChanged = previousSig !== incomingSig;

  let versions = await listPromptVersions(cookieHeader, promptId);
  if (structureChanged && String(lanes.dev.content || '').trim()) {
    await snapshotFrom(cookieHeader, userId, promptId, lanes.dev, versions);
  }

  if (input.variables) {
    await replacePromptVariables(cookieHeader, userId, promptId, input.variables);
  }

  await ncbUpdate('prompt_versions', cookieHeader, requireNcbId(lanes.dev, 'Working copy'), {
    content: input.content,
    model: input.model,
    temperature: input.temperature,
    max_tokens: input.max_tokens,
    response_format: incoming.responseFormat,
    variables_json: encodeStructure(incoming),
    lane: 'dev',
    locked: 0,
    populated: 1,
  });

  return {
    snapshotCreated: structureChanged && Boolean(String(lanes.dev.content || '').trim()),
    lanes: await ensureSystemLanes(cookieHeader, userId, prompt),
  };
}

export async function createManualSnapshot(
  cookieHeader: string,
  userId: string,
  prompt: NcbRecord
): Promise<PromptVersionRecord> {
  const promptId = String(prompt.supabase_id || prompt.id || '');
  const lanes = await ensureSystemLanes(cookieHeader, userId, prompt);
  const versions = await listPromptVersions(cookieHeader, promptId);
  return snapshotFrom(cookieHeader, userId, promptId, lanes.dev, versions);
}

export async function maybeSnapshotForIoChange(
  cookieHeader: string,
  userId: string,
  prompt: NcbRecord
): Promise<{ snapshotCreated: boolean }> {
  const promptId = String(prompt.supabase_id || prompt.id || '');
  const lanes = await ensureSystemLanes(cookieHeader, userId, prompt);
  const previous = decodeStructure(lanes.dev.variables_json);
  const incoming = await currentStructure(
    cookieHeader,
    promptId,
    previous.responseFormat || String(prompt.response_format || 'text')
  );
  if (structureSignature(previous) === structureSignature(incoming)) {
    return { snapshotCreated: false };
  }

  const versions = await listPromptVersions(cookieHeader, promptId);
  if (String(lanes.dev.content || '').trim()) {
    await snapshotFrom(cookieHeader, userId, promptId, lanes.dev, versions);
  }

  await ncbUpdate('prompt_versions', cookieHeader, requireNcbId(lanes.dev, 'Working copy'), {
    variables_json: encodeStructure(incoming),
    lane: 'dev',
    locked: 0,
  });

  return { snapshotCreated: true };
}

export async function promoteDevToProd(
  cookieHeader: string,
  userId: string,
  prompt: NcbRecord,
  changelog: string
): Promise<VersionLanes> {
  const promptId = String(prompt.supabase_id || prompt.id || '');
  const lanes = await ensureSystemLanes(cookieHeader, userId, prompt);

  if (!String(lanes.dev.content || '').trim()) {
    throw new Error('Cannot publish an empty working copy');
  }

  let versions = await listPromptVersions(cookieHeader, promptId);

  if (isProdPopulated(lanes.prod)) {
    await ncbUpdate('prompt_versions', cookieHeader, requireNcbId(lanes.prod, 'Production'), {
      lane: 'snapshot',
      locked: 1,
      populated: 1,
      version_number:
        Number(lanes.prod.version_number || 0) > 0
          ? lanes.prod.version_number
          : nextSnapshotNumber(versions),
    });
  } else if (typeof lanes.prod.id === 'number') {
    await ncbDelete('prompt_versions', cookieHeader, lanes.prod.id);
  }

  await ncbUpdate('prompt_versions', cookieHeader, requireNcbId(lanes.dev, 'Working copy'), {
    lane: 'prod',
    locked: 1,
    populated: 1,
    changelog,
  });

  if (lanes.shelf && typeof lanes.shelf.id === 'number') {
    await ncbUpdate('prompt_versions', cookieHeader, lanes.shelf.id, {
      lane: 'dev',
      locked: 0,
      populated: 1,
    });
    const restored = await findByPublicId<PromptVersionRecord>(
      'prompt_versions',
      cookieHeader,
      String(lanes.shelf.supabase_id || '')
    );
    if (restored) await syncPromptRow(cookieHeader, prompt, restored);
  } else {
    const published = versionFields(lanes.dev);
    const cloned = await createVersionRow(cookieHeader, {
      prompt_id: promptId,
      version_number: nextSnapshotNumber(await listPromptVersions(cookieHeader, promptId)),
      ...published,
      lane: 'dev',
      locked: 0,
      populated: 1,
      created_by: userId,
      created_at: nowSql(),
      user_id: userId,
    });
    await syncPromptRow(cookieHeader, prompt, cloned);
  }

  return ensureSystemLanes(cookieHeader, userId, prompt);
}

export async function editProduction(
  cookieHeader: string,
  userId: string,
  prompt: NcbRecord
): Promise<VersionLanes> {
  const promptId = String(prompt.supabase_id || prompt.id || '');
  const lanes = await ensureSystemLanes(cookieHeader, userId, prompt);

  if (!isProdPopulated(lanes.prod)) {
    throw new Error('Production is empty until the first deploy');
  }
  if (lanes.shelf) {
    throw new Error('Already editing production. Cancel or publish first.');
  }

  await ncbUpdate('prompt_versions', cookieHeader, requireNcbId(lanes.dev, 'Working copy'), {
    lane: 'shelf',
    locked: 1,
    populated: 1,
  });

  const prodFields = versionFields(lanes.prod);
  const hotfix = await createVersionRow(cookieHeader, {
    prompt_id: promptId,
    version_number: nextSnapshotNumber(await listPromptVersions(cookieHeader, promptId)),
    ...prodFields,
    lane: 'dev',
    locked: 0,
    populated: 1,
    created_by: userId,
    created_at: nowSql(),
    user_id: userId,
  });
  await syncPromptRow(cookieHeader, prompt, hotfix);

  if (prodFields.variables_json) {
    const structure = decodeStructure(prodFields.variables_json);
    await replacePromptVariables(cookieHeader, userId, promptId, structure.variables);
  }

  return ensureSystemLanes(cookieHeader, userId, prompt);
}

export async function cancelProdEdit(
  cookieHeader: string,
  userId: string,
  prompt: NcbRecord
): Promise<VersionLanes> {
  const lanes = await ensureSystemLanes(cookieHeader, userId, prompt);
  if (!lanes.shelf || typeof lanes.shelf.id !== 'number') {
    throw new Error('No parked working copy to restore');
  }

  if (typeof lanes.dev.id === 'number') {
    await ncbDelete('prompt_versions', cookieHeader, lanes.dev.id);
  }

  await ncbUpdate('prompt_versions', cookieHeader, lanes.shelf.id, {
    lane: 'dev',
    locked: 0,
    populated: 1,
  });

  const restored = await findByPublicId<PromptVersionRecord>(
    'prompt_versions',
    cookieHeader,
    String(lanes.shelf.supabase_id || '')
  );
  if (restored) {
    await syncPromptRow(cookieHeader, prompt, restored);
    const structure = decodeStructure(restored.variables_json);
    const promptId = String(prompt.supabase_id || prompt.id || '');
    await replacePromptVariables(cookieHeader, userId, promptId, structure.variables);
  }

  return ensureSystemLanes(cookieHeader, userId, prompt);
}

export async function copyVersionIntoDev(
  cookieHeader: string,
  userId: string,
  prompt: NcbRecord,
  version: PromptVersionRecord
): Promise<VersionLanes> {
  const promptId = String(prompt.supabase_id || prompt.id || '');
  const lanes = await ensureSystemLanes(cookieHeader, userId, prompt);
  const fields = versionFields(version);
  const versions = await listPromptVersions(cookieHeader, promptId);

  if (String(lanes.dev.content || '') !== fields.content) {
    await snapshotFrom(cookieHeader, userId, promptId, lanes.dev, versions);
  }

  await ncbUpdate('prompt_versions', cookieHeader, requireNcbId(lanes.dev, 'Working copy'), {
    ...fields,
    lane: 'dev',
    locked: 0,
    populated: 1,
  });
  await syncPromptRow(cookieHeader, prompt, { ...lanes.dev, ...fields });

  const structure = decodeStructure(fields.variables_json);
  if (structure.variables.length > 0) {
    await replacePromptVariables(cookieHeader, userId, promptId, structure.variables);
  }

  return ensureSystemLanes(cookieHeader, userId, prompt);
}

export async function rollbackProduction(
  cookieHeader: string,
  userId: string,
  prompt: NcbRecord,
  snapshotPublicId: string,
  changelog: string
): Promise<VersionLanes> {
  const promptId = String(prompt.supabase_id || prompt.id || '');
  const lanes = await ensureSystemLanes(cookieHeader, userId, prompt);
  const versions = await listPromptVersions(cookieHeader, promptId);
  const snapshot =
    versions.find((version) => String(version.supabase_id || '') === snapshotPublicId) ||
    versions.find((version) => String(version.id) === snapshotPublicId);

  if (!snapshot) {
    throw new Error('Snapshot not found');
  }
  if (parseLane(snapshot.lane) === 'dev') {
    throw new Error('Cannot roll production back to the working copy');
  }

  if (isProdPopulated(lanes.prod) && typeof lanes.prod.id === 'number') {
    await ncbUpdate('prompt_versions', cookieHeader, lanes.prod.id, {
      lane: 'snapshot',
      locked: 1,
      populated: 1,
      version_number:
        Number(lanes.prod.version_number || 0) > 0
          ? lanes.prod.version_number
          : nextSnapshotNumber(versions),
    });
  } else if (typeof lanes.prod.id === 'number') {
    await ncbDelete('prompt_versions', cookieHeader, lanes.prod.id);
  }

  await createVersionRow(cookieHeader, {
    prompt_id: promptId,
    version_number: nextSnapshotNumber(await listPromptVersions(cookieHeader, promptId)),
    ...versionFields(snapshot),
    changelog,
    lane: 'prod',
    locked: 1,
    populated: 1,
    created_by: userId,
    created_at: nowSql(),
    user_id: userId,
  });

  return ensureSystemLanes(cookieHeader, userId, prompt);
}

export async function getPublishedVersion(
  cookieHeader: string,
  promptId: string
): Promise<PromptVersionRecord | null> {
  const versions = await listPromptVersions(cookieHeader, promptId);
  const prod = versions.find((version) => parseLane(version.lane) === 'prod');
  if (!isProdPopulated(prod)) return null;
  return prod ?? null;
}

export function serializeLanes(lanes: VersionLanes) {
  return {
    lanes: {
      dev: toPublicRecord(lanes.dev),
      prod: toPublicRecord(lanes.prod),
      shelf: lanes.shelf ? toPublicRecord(lanes.shelf) : null,
    },
    snapshots: lanes.snapshots.map((snapshot) => toPublicRecord(snapshot)),
    editingProd: Boolean(lanes.shelf),
    prodPublished: isProdPopulated(lanes.prod),
    drifted:
      isProdPopulated(lanes.prod) &&
      String(lanes.dev.content || '') !== String(lanes.prod.content || ''),
  };
}

export async function readLiveSnapshot(
  cookieHeader: string,
  promptId: string
) {
  const versions = await listPromptVersions(cookieHeader, promptId);
  const prod = versions.find((version) => parseLane(version.lane) === 'prod');
  const dev = versions.find((version) => parseLane(version.lane) === 'dev');
  const snapshots = versions
    .filter((version) => parseLane(version.lane) === 'snapshot')
    .sort((a, b) => Number(b.version_number || 0) - Number(a.version_number || 0));
  const previous = snapshots[0];

  return {
    versionNumber: Number(prod?.version_number || 0),
    changelog: String(prod?.changelog || ''),
    populated: isProdPopulated(prod),
    drifted:
      isProdPopulated(prod) &&
      String(dev?.content || '') !== String(prod?.content || ''),
    previousSnapshotId: previous ? String(previous.supabase_id || previous.id || '') : null,
    previousVersionNumber: previous ? Number(previous.version_number || 0) : null,
  };
}
