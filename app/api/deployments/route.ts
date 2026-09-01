import { NextRequest, NextResponse } from 'next/server';
import {
  ensureDefaultOrganization,
  findByPublicId,
  ncbCreate,
  ncbRead,
  ncbUpdate,
  newSupabaseId,
  requireSession,
  toPublicId,
  toPublicRecord,
  toPublicRecords,
  ensureOrganizationVanitySubdomain,
  getOrganizationByPublicId,
} from '@/lib/ncb-server';
import {
  buildDeploymentUrl,
  isDeployEnvironment,
  type DeployEnvironment,
} from '@/lib/tenant-domains';
import { promoteDevToProd, readLiveSnapshot } from '@/lib/prompt-versions';
import { validateChangelog } from '@/lib/changelog';

function nextVersion(existingCount: number): string {
  const patch = existingCount + 1;
  return `v1.0.${patch}`;
}

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    await requireSession(cookieHeader);

    const [deployments, endpoints, prompts] = await Promise.all([
      ncbRead('deployments', cookieHeader, {
        sort: 'created_at',
        order: 'desc',
      }),
      ncbRead('api_endpoints', cookieHeader),
      ncbRead('prompts', cookieHeader),
    ]);

    const endpointById = new Map(
      endpoints.map((endpoint) => [toPublicId(endpoint), endpoint])
    );
    const promptById = new Map(
      prompts.map((prompt) => [toPublicId(prompt), prompt])
    );
    const liveCache = new Map<string, Awaited<ReturnType<typeof readLiveSnapshot>>>();

    const enriched = [];
    for (const deployment of toPublicRecords(deployments)) {
      const endpoint = endpointById.get(String(deployment.endpoint_id || ''));
      const promptId = endpoint?.prompt_id ? String(endpoint.prompt_id) : '';
      const prompt = promptId ? promptById.get(promptId) : undefined;
      let live = null;
      if (promptId) {
        if (!liveCache.has(promptId)) {
          liveCache.set(promptId, await readLiveSnapshot(cookieHeader, promptId));
        }
        live = liveCache.get(promptId) ?? null;
      }

      enriched.push({
        ...deployment,
        prompt_id: promptId || null,
        prompt_name: prompt ? String(prompt.name || '') : null,
        live_snapshot: live
          ? {
              versionNumber: live.versionNumber,
              changelog: live.changelog || String(deployment.changelog || ''),
              published: live.populated,
              drifted: live.drifted,
              previousSnapshotId: live.previousSnapshotId,
              previousVersionNumber: live.previousVersionNumber,
            }
          : null,
      });
    }

    return NextResponse.json({ deployments: enriched });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const user = await requireSession(cookieHeader);
    const orgMember = await ensureDefaultOrganization(user, cookieHeader);
    const body = await req.json();

    if (!body.endpoint_id) {
      return NextResponse.json(
        { error: 'endpoint_id is required' },
        { status: 400 }
      );
    }

    const environmentInput = String(body.environment || 'production');
    if (!isDeployEnvironment(environmentInput)) {
      return NextResponse.json(
        { error: 'environment must be production, staging, or development' },
        { status: 400 }
      );
    }
    const environment = environmentInput as DeployEnvironment;

    const endpoint = await findByPublicId(
      'api_endpoints',
      cookieHeader,
      String(body.endpoint_id)
    );
    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    const orgId = String(orgMember.organization_id || '');
    if (
      endpoint.organization_id &&
      orgId &&
      String(endpoint.organization_id) !== orgId
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const org = await getOrganizationByPublicId(orgId, cookieHeader);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const vanitySubdomain = await ensureOrganizationVanitySubdomain(
      orgId,
      cookieHeader,
      String(org.slug || orgId)
    );

    const useCustomDomain =
      body.use_custom_domain === true && environment === 'production';
    const orgCustomDomain = org.custom_domain ? String(org.custom_domain) : null;
    const orgCustomDomainVerified =
      org.custom_domain_verified === 1 || org.custom_domain_verified === true;

    let deploymentCustomDomain: string | null = null;
    if (useCustomDomain) {
      if (body.custom_domain) {
        deploymentCustomDomain = String(body.custom_domain)
          .toLowerCase()
          .replace(/^https?:\/\//, '')
          .replace(/\/.*$/, '');
      } else if (orgCustomDomainVerified && orgCustomDomain) {
        deploymentCustomDomain = orgCustomDomain;
      } else {
        return NextResponse.json(
          { error: 'Custom domain is not configured or verified for this organization' },
          { status: 400 }
        );
      }
    }

    const region = body.region || 'us-east-1';
    const endpointPublicId = toPublicId(endpoint);
    const path = String(endpoint.path || '');
    const url = buildDeploymentUrl({
      path,
      environment,
      vanitySubdomain,
      customDomain: deploymentCustomDomain,
      useCustomDomain,
    });
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    let changelog = '';
    try {
      changelog =
        environment === 'production'
          ? validateChangelog(body.changelog)
          : String(body.changelog || '').trim() || `Deployed to ${environment}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid changelog';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const linkedPromptId = endpoint.prompt_id ? String(endpoint.prompt_id) : '';
    let promptVersion: number | null = null;
    if (linkedPromptId) {
      const prompt = await findByPublicId('prompts', cookieHeader, linkedPromptId);
      if (prompt) {
        const lanes = await promoteDevToProd(
          cookieHeader,
          user.id,
          prompt,
          changelog
        );
        promptVersion = Number(lanes.prod.version_number || 0);
      }
    }

    const existingDeployments = await ncbRead('deployments', cookieHeader, {
      endpoint_id: endpointPublicId,
    });
    const sameEnvironment = existingDeployments.filter(
      (deployment) => String(deployment.environment || 'production') === environment
    );
    const version = nextVersion(sameEnvironment.length);

    const deploymentPayload: Record<string, unknown> = {
      organization_id: orgId,
      endpoint_id: endpointPublicId,
      created_by: user.id,
      name: String(endpoint.name || 'Untitled API'),
      url,
      status: 'deployed',
      environment,
      version,
      region,
      custom_domain: useCustomDomain ? deploymentCustomDomain : null,
      error_message: null,
      deployed_at: now,
      updated_at: now,
      user_id: user.id,
      changelog,
      prompt_version: promptVersion,
    };

    let record;

    if (sameEnvironment.length > 0 && sameEnvironment[0]?.id !== undefined) {
      const existing = sameEnvironment[0];
      const existingId = existing.id as number;
      await ncbUpdate(
        'deployments',
        cookieHeader,
        existingId,
        deploymentPayload
      );
      record = await findByPublicId(
        'deployments',
        cookieHeader,
        toPublicId(existing)
      );
    } else {
      const supabaseId = newSupabaseId();
      await ncbCreate('deployments', cookieHeader, {
        supabase_id: supabaseId,
        ...deploymentPayload,
        created_at: now,
      });
      record = await findByPublicId('deployments', cookieHeader, supabaseId);
    }

    if (!record) {
      return NextResponse.json(
        { error: 'Deployment created but could not be retrieved' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        deployment: toPublicRecord(record),
        vanitySubdomain,
        environment,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Unauthorized' ? 401 : 500;
    console.error('Error in POST /api/deployments:', error);
    return NextResponse.json({ error: message }, { status });
  }
}
