import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  extractApiKeyFromRequest,
  touchApiKeyLastUsed,
  verifyApiKeyForOrganization,
} from '@/lib/api-key-auth';
import {
  findByPublicId,
  getOrganizationByCustomDomain,
  getOrganizationByVanitySubdomain,
  logApiCall,
  ncbRead,
  type NcbRecord,
} from '@/lib/ncb-server';
import { renderPromptTemplate } from '@/lib/prompt-render';
import {
  normalizePath,
  parseTenantHost,
  type DeployEnvironment,
} from '@/lib/tenant-domains';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

function getRequestHost(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-host') ||
    req.headers.get('host') ||
    ''
  );
}

async function resolveDeployment(
  host: string,
  requestPath: string,
  method: string
): Promise<
  | {
      deployment: NcbRecord;
      endpoint: NcbRecord;
      organization: NcbRecord;
      environment: DeployEnvironment;
    }
  | { error: string; status: number }
> {
  const parsed = parseTenantHost(host);
  if (!parsed) {
    return { error: 'Invalid host', status: 400 };
  }

  let organization: NcbRecord | null = null;

  if (parsed.vanitySubdomain) {
    organization = await getOrganizationByVanitySubdomain(parsed.vanitySubdomain);
  } else if (parsed.customDomain) {
    organization = await getOrganizationByCustomDomain(parsed.customDomain);
    if (
      organization &&
      organization.custom_domain_verified !== 1 &&
      organization.custom_domain_verified !== true
    ) {
      return { error: 'Custom domain not verified', status: 403 };
    }
  }

  if (!organization) {
    return { error: 'Tenant not found', status: 404 };
  }

  const orgId = organization.supabase_id || String(organization.id);
  const normalizedPath = normalizePath(requestPath);

  const deployments = await ncbRead('deployments', '', {
    organization_id: String(orgId),
  });

  const environment = parsed.environment;
  const activeDeployments = deployments.filter(
    (deployment) =>
      String(deployment.status || '') === 'deployed' &&
      String(deployment.environment || 'production') === environment
  );

  for (const deployment of activeDeployments) {
    const endpointId = String(deployment.endpoint_id || '');
    if (!endpointId) continue;

    const endpoint = await findByPublicId('api_endpoints', '', endpointId);
    if (!endpoint) continue;

    const endpointPath = normalizePath(String(endpoint.path || ''));
    const endpointMethod = String(endpoint.method || 'POST').toUpperCase();

    if (endpointPath === normalizedPath && endpointMethod === method.toUpperCase()) {
      return { deployment, endpoint, organization, environment };
    }
  }

  return { error: 'Endpoint not found for this host and path', status: 404 };
}

async function handleGateway(
  req: NextRequest,
  pathSegments: string[]
) {
  const host = getRequestHost(req);
  const requestPath = normalizePath(pathSegments.join('/'));
  const resolved = await resolveDeployment(host, requestPath, req.method);

  if ('error' in resolved) {
    return NextResponse.json(
      { error: resolved.error },
      { status: resolved.status }
    );
  }

  const { deployment, endpoint, organization, environment } = resolved;
  const orgId = String(organization.supabase_id || organization.id);
  const requiresApiKey =
    environment === 'production' &&
    String(endpoint.authentication || 'api-key') === 'api-key';

  if (requiresApiKey && req.method !== 'GET') {
    const apiKey = extractApiKeyFromRequest(req.headers);
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'API key required for production endpoints. Pass Authorization: Bearer pp_live_... or X-API-Key header.',
        },
        { status: 401 }
      );
    }

    const matchedKey = await verifyApiKeyForOrganization(
      apiKey,
      orgId,
      'write'
    );
    if (!matchedKey) {
      return NextResponse.json({ error: 'Invalid or inactive API key' }, { status: 401 });
    }

    await touchApiKeyLastUsed(matchedKey);
  }

  if (req.method === 'GET') {
    return NextResponse.json({
      status: 'ok',
      deployment: {
        id: deployment.supabase_id || deployment.id,
        name: deployment.name,
        url: deployment.url,
        environment: deployment.environment,
        version: deployment.version,
      },
      endpoint: {
        id: endpoint.supabase_id || endpoint.id,
        name: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
      },
      organization: {
        id: organization.supabase_id || organization.id,
        name: organization.name,
      },
    });
  }

  if (req.method === 'POST') {
    const promptId = endpoint.prompt_id ? String(endpoint.prompt_id) : '';
    if (!promptId) {
      return NextResponse.json(
        { error: 'Endpoint has no linked prompt' },
        { status: 503 }
      );
    }

    const startTime = Date.now();
    const bodyText = await req.text();
    let variables: Record<string, unknown> = {};

    try {
      if (bodyText.trim()) {
        variables = JSON.parse(bodyText) as Record<string, unknown>;
      }
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const prompt = await findByPublicId('prompts', '', promptId);
    if (!prompt) {
      return NextResponse.json({ error: 'Linked prompt not found' }, { status: 503 });
    }

    const renderedPrompt = renderPromptTemplate(
      String(prompt.content || ''),
      variables
    );
    const model = String(prompt.model || 'gpt-3.5-turbo');
    const temperature = Number(prompt.temperature ?? 0.7);
    const maxTokens = Number(prompt.max_tokens ?? 1000);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured on server' },
        { status: 500 }
      );
    }

    const llmResponse = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: renderedPrompt }],
      temperature,
      max_tokens: maxTokens,
    });

    const content = llmResponse.choices[0]?.message?.content || '';
    const usage = llmResponse.usage || {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    };

    const responsePayload = {
      content,
      tokens_used: usage.total_tokens,
      model,
      provider: 'openai',
      usage,
    };

    await logApiCall('', String(deployment.user_id || organization.user_id || ''), {
      organization_id: String(organization.supabase_id || organization.id),
      deployment_id: String(deployment.supabase_id || deployment.id),
      method: req.method,
      path: requestPath,
      status_code: 200,
      response_time_ms: Date.now() - startTime,
      request_size_bytes: Buffer.byteLength(bodyText, 'utf8'),
      response_size_bytes: Buffer.byteLength(JSON.stringify(responsePayload), 'utf8'),
      user_agent: req.headers.get('user-agent') || undefined,
      ip_address:
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        undefined,
      tokens_used: usage.total_tokens,
    });

    return NextResponse.json(responsePayload);
  }

  return NextResponse.json(
    { error: `Method ${req.method} not allowed` },
    { status: 405 }
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleGateway(req, path);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleGateway(req, path);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleGateway(req, path);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleGateway(req, path);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleGateway(req, path);
}
