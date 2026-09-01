'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  buildDeploymentUrl,
  type DeployEnvironment,
} from '@/lib/tenant-domains';
import { 
  ArrowLeft,
  Code,
  Save,
  Play,
  Plus,
  Trash2,
  Copy,
  Settings,
  Key,
  Shield,
  Zap,
  Database,
  ArrowRight,
  ArrowDown,
  Globe,
  Clock,
  AlertCircle,
  Loader2,
  Rocket
} from 'lucide-react';

interface EndpointField {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface APIEndpoint {
  id: string;
  method: string;
  path: string;
  name: string;
  description: string;
  requestFields: EndpointField[];
  responseFields: EndpointField[];
  promptId: string;
  authentication: string;
  rateLimit: number;
}

interface PromptOption {
  id: string;
  name: string;
}

interface PromptVariable {
  name: string;
  type: string;
}

interface OrgDomainSettings {
  vanitySubdomain: string | null;
  customDomain: string | null;
  customDomainVerified: boolean;
  baseDomain: string;
}

function mapDbEndpoint(
  ep: Record<string, unknown>,
  fields?: { requestFields: EndpointField[]; responseFields: EndpointField[] }
): APIEndpoint {
  return {
    id: String(ep.id),
    method: String(ep.method || 'POST'),
    path: String(ep.path || ''),
    name: String(ep.name || ''),
    description: String(ep.description || ''),
    requestFields: fields?.requestFields || [],
    responseFields: fields?.responseFields || [],
    promptId: ep.prompt_id ? String(ep.prompt_id) : '',
    authentication: String(ep.authentication || 'api-key'),
    rateLimit: Number(ep.rate_limit ?? 100),
  };
}

export default function APIDesigner() {
  const router = useRouter();
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [availablePrompts, setAvailablePrompts] = useState<PromptOption[]>([]);
  const [selectedPromptVariables, setSelectedPromptVariables] = useState<PromptVariable[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [activeTab, setActiveTab] = useState('design');
  const [testRequest, setTestRequest] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [deployEnvironment, setDeployEnvironment] = useState<DeployEnvironment>('production');
  const [deployChangelog, setDeployChangelog] = useState('');
  const [useCustomDomain, setUseCustomDomain] = useState(false);
  const [orgDomains, setOrgDomains] = useState<OrgDomainSettings | null>(null);

  const loadPrompts = useCallback(async () => {
    try {
      setLoadingPrompts(true);
      const response = await fetch('/api/prompts', { credentials: 'include' });
      const data = await response.json();

      if (response.ok) {
        setAvailablePrompts(
          (data.prompts || []).map((prompt: { id: string; name: string }) => ({
            id: prompt.id,
            name: prompt.name,
          }))
        );
      } else {
        toast.error(data.error || 'Failed to load prompts');
      }
    } catch {
      toast.error('Failed to load prompts');
    } finally {
      setLoadingPrompts(false);
    }
  }, []);

  const loadEndpointFields = useCallback(async (endpointId: string) => {
    const response = await fetch(`/api/endpoints/${endpointId}/fields`, {
      credentials: 'include',
    });
    if (!response.ok) {
      return { requestFields: [], responseFields: [] };
    }
    return response.json();
  }, []);

  const loadEndpoints = useCallback(async () => {
    const response = await fetch('/api/endpoints', { credentials: 'include' });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load endpoints');
    }

    const mapped = await Promise.all(
      (data.endpoints || []).map(async (ep: Record<string, unknown>) => {
        const fields = await loadEndpointFields(String(ep.id));
        return mapDbEndpoint(ep, fields);
      })
    );

    setEndpoints(mapped);
    if (mapped.length > 0) {
      setSelectedEndpoint((current) => current || mapped[0].id);
    }
  }, [loadEndpointFields]);

  const loadOrgDomains = useCallback(async () => {
    const response = await fetch('/api/organizations/domains', {
      credentials: 'include',
    });
    const data = await response.json();
    if (response.ok && data.organization) {
      setOrgDomains({
        vanitySubdomain: data.organization.vanitySubdomain,
        customDomain: data.organization.customDomain,
        customDomainVerified: data.organization.customDomainVerified,
        baseDomain: data.baseDomain,
      });
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        await Promise.all([loadPrompts(), loadEndpoints(), loadOrgDomains()]);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load API designer data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [loadPrompts, loadEndpoints, loadOrgDomains]);

  const loadPromptVariables = useCallback(async (promptId: string) => {
    if (!promptId) {
      setSelectedPromptVariables([]);
      return;
    }

    try {
      const response = await fetch(`/api/prompts/${promptId}/variables`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (response.ok) {
        setSelectedPromptVariables(
          (data.variables || []).map((variable: { name: string; type?: string }) => ({
            name: variable.name,
            type: variable.type || 'string',
          }))
        );
      } else {
        setSelectedPromptVariables([]);
      }
    } catch {
      setSelectedPromptVariables([]);
    }
  }, []);

  const fieldTypes = [
    'string', 'number', 'boolean', 'array', 'object', 'date', 'email', 'url'
  ];

  const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  const getCurrentEndpoint = (): APIEndpoint | null => {
    if (!selectedEndpoint) return null;
    return endpoints.find((ep) => ep.id === selectedEndpoint) ?? null;
  };

  const updateEndpoint = (field: string, value: string | number | EndpointField[]) => {
    if (!selectedEndpoint) return;

    setEndpoints((current) =>
      current.map((ep) =>
        ep.id === selectedEndpoint ? { ...ep, [field]: value } : ep
      )
    );

    if (field === 'promptId' && typeof value === 'string') {
      loadPromptVariables(value);
    }
  };

  useEffect(() => {
    const ep = endpoints.find((e) => e.id === selectedEndpoint);
    if (ep?.promptId) {
      loadPromptVariables(ep.promptId);
    } else {
      setSelectedPromptVariables([]);
    }
  }, [selectedEndpoint, loadPromptVariables]);

  const addRequestField = () => {
    const endpoint = getCurrentEndpoint();
    if (!endpoint) return;
    updateEndpoint('requestFields', [
      ...endpoint.requestFields,
      { name: '', type: 'string', required: false, description: '' },
    ]);
  };

  const addResponseField = () => {
    const endpoint = getCurrentEndpoint();
    if (!endpoint) return;
    updateEndpoint('responseFields', [
      ...endpoint.responseFields,
      { name: '', type: 'string', required: true, description: '' },
    ]);
  };

  const updateRequestField = (index: number, field: string, value: string | boolean) => {
    const endpoint = getCurrentEndpoint();
    if (!endpoint) return;
    const updated = [...endpoint.requestFields];
    updated[index] = { ...updated[index], [field]: value };
    updateEndpoint('requestFields', updated);
  };

  const updateResponseField = (index: number, field: string, value: string | boolean) => {
    const endpoint = getCurrentEndpoint();
    if (!endpoint) return;
    const updated = [...endpoint.responseFields];
    updated[index] = { ...updated[index], [field]: value };
    updateEndpoint('responseFields', updated);
  };

  const removeRequestField = (index: number) => {
    const endpoint = getCurrentEndpoint();
    if (!endpoint) return;
    updateEndpoint(
      'requestFields',
      endpoint.requestFields.filter((_, i) => i !== index)
    );
  };

  const removeResponseField = (index: number) => {
    const endpoint = getCurrentEndpoint();
    if (!endpoint) return;
    updateEndpoint(
      'responseFields',
      endpoint.responseFields.filter((_, i) => i !== index)
    );
  };

  const addNewEndpoint = async () => {
    try {
      const response = await fetch('/api/endpoints', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Endpoint',
          path: '/api/new-endpoint',
          method: 'POST',
          description: '',
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create endpoint');
      }

      const newEndpoint = mapDbEndpoint(data.endpoint);
      setEndpoints((current) => [...current, newEndpoint]);
      setSelectedEndpoint(newEndpoint.id);
      toast.success('Endpoint created');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create endpoint');
    }
  };

  const saveEndpoint = async (options?: { silent?: boolean }) => {
    const endpoint = getCurrentEndpoint();
    if (!endpoint) return false;

    setSaving(true);
    try {
      const response = await fetch(`/api/endpoints/${endpoint.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: endpoint.name,
          path: endpoint.path,
          method: endpoint.method,
          description: endpoint.description || null,
          ...(endpoint.promptId ? { prompt_id: endpoint.promptId } : {}),
          authentication: endpoint.authentication,
          rate_limit: Number.isFinite(endpoint.rateLimit) ? endpoint.rateLimit : 100,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save endpoint');
      }

      const fieldsResponse = await fetch(`/api/endpoints/${endpoint.id}/fields`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestFields: endpoint.requestFields.filter((field) => field.name.trim()),
          responseFields: endpoint.responseFields.filter((field) => field.name.trim()),
        }),
      });

      if (!fieldsResponse.ok) {
        const fieldsData = await fieldsResponse.json();
        throw new Error(fieldsData.error || 'Failed to save endpoint fields');
      }

      if (!options?.silent) {
        toast.success('Endpoint saved');
      }
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save endpoint');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const getDeploymentPreviewUrl = (
    endpointPath: string,
    environment: DeployEnvironment = deployEnvironment,
    custom = useCustomDomain
  ) => {
    if (!orgDomains?.vanitySubdomain) {
      return `https://beta.promptpilot.run${endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`}`;
    }
    return buildDeploymentUrl({
      path: endpointPath,
      environment,
      vanitySubdomain: orgDomains.vanitySubdomain,
      customDomain: orgDomains.customDomain,
      useCustomDomain: custom && orgDomains.customDomainVerified,
    });
  };

  const openDeployDialog = () => {
    const current = getCurrentEndpoint();
    if (!current) return;

    if (!current.name.trim() || !current.path.trim()) {
      toast.error('Add a name and path before deploying');
      return;
    }

    if (!current.promptId) {
      toast.error('Select a prompt in Prompt Mapping before deploying');
      return;
    }

    setDeployDialogOpen(true);
  };

  const deployEndpoint = async () => {
    const endpoint = getCurrentEndpoint();
    if (!endpoint) return;

    setDeploying(true);
    try {
      const saved = await saveEndpoint({ silent: true });
      if (!saved) return;

      const response = await fetch('/api/deployments', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint_id: endpoint.id,
          environment: deployEnvironment,
          use_custom_domain: useCustomDomain,
          changelog: deployChangelog,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deploy endpoint');
      }

      setDeployDialogOpen(false);
      toast.success('Endpoint deployed', {
        description: data.deployment?.url
          ? `Live at ${data.deployment.url}`
          : 'View it on the Deployments page',
        action: {
          label: 'View',
          onClick: () => router.push('/deployments'),
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to deploy endpoint');
    } finally {
      setDeploying(false);
    }
  };

  const testEndpoint = async () => {
    const endpoint = getCurrentEndpoint();
    if (!endpoint) return;

    if (!endpoint.promptId) {
      toast.error('Select a prompt before testing this endpoint');
      return;
    }

    setTestResponse('Running test...');

    try {
      let variables: Record<string, unknown> = {};
      if (testRequest.trim()) {
        variables = JSON.parse(testRequest);
      }

      const response = await fetch('/api/llm/execute', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt_id: endpoint.promptId,
          variables,
        }),
      });
      const data = await response.json();
      setTestResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResponse(
        JSON.stringify(
          { error: error instanceof Error ? error.message : 'Test request failed' },
          null,
          2
        )
      );
    }
  };

  const endpoint = getCurrentEndpoint();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Dialog open={deployDialogOpen} onOpenChange={setDeployDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deploy API Endpoint</DialogTitle>
            <DialogDescription>
              Choose an environment and domain. Each environment gets its own deployment URL.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="deploy-environment">Environment</Label>
              <Select
                value={deployEnvironment}
                onValueChange={(value) => setDeployEnvironment(value as DeployEnvironment)}
              >
                <SelectTrigger id="deploy-environment" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {orgDomains?.customDomainVerified && orgDomains.customDomain && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="use-custom-domain">Use custom domain</Label>
                  <p className="text-sm text-gray-500">{orgDomains.customDomain}</p>
                </div>
                <Switch
                  id="use-custom-domain"
                  checked={useCustomDomain}
                  onCheckedChange={setUseCustomDomain}
                />
              </div>
            )}

            {deployEnvironment === 'production' && (
              <div>
                <Label htmlFor="deploy-changelog">Production changelog</Label>
                <Textarea
                  id="deploy-changelog"
                  className="mt-1 min-h-[90px]"
                  value={deployChangelog}
                  onChange={(event) => setDeployChangelog(event.target.value)}
                  placeholder="What is going live? e.g. Added required order_id and tightened refund wording."
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Required for production. At least 8 characters.
                </p>
              </div>
            )}

            {deployEnvironment === 'production' && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                Production requests require an API key. Create one in Settings → API Keys and pass{' '}
                <code>Authorization: Bearer pp_live_...</code> or <code>X-API-Key</code>.
              </div>
            )}

            {!orgDomains?.vanitySubdomain && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                A vanity subdomain will be assigned automatically on first deploy.
                Set your preferred subdomain in Settings → Domains.
              </div>
            )}

            {endpoint && (
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Deployment URL preview</p>
                <code className="text-sm break-all">
                  {getDeploymentPreviewUrl(endpoint.path)}
                </code>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeployDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                void deployEndpoint();
              }}
              disabled={
                deploying ||
                (deployEnvironment === 'production' && deployChangelog.trim().length < 8)
              }
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {deploying ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Rocket className="w-4 h-4 mr-2" />
              )}
              {deploying ? 'Deploying...' : 'Deploy now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-2">
                <Code className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">API Designer</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-2" />
                Export Schema
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                onClick={() => {
                  void saveEndpoint();
                }}
                disabled={saving || deploying || !endpoint}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save API'}
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                onClick={openDeployDialog}
                disabled={saving || deploying || !endpoint}
              >
                <Rocket className="w-4 h-4 mr-2" />
                Deploy
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Endpoints List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  API Endpoints
                  <Button size="sm" variant="outline" onClick={addNewEndpoint}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {endpoints.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <p className="text-sm">No endpoints yet.</p>
                    <p className="text-xs mt-1">Create one to get started.</p>
                  </div>
                ) : (
                  endpoints.map((ep) => (
                  <div
                    key={ep.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedEndpoint === ep.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedEndpoint(ep.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={ep.method === 'POST' ? 'default' : 'secondary'}>
                        {ep.method}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-sm text-gray-900">{ep.name}</h4>
                    <p className="text-xs text-gray-600 mt-1">{ep.path}</p>
                  </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">API Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Endpoints</span>
                  <span className="font-medium">{endpoints.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Available Prompts</span>
                  <span className="font-medium">{availablePrompts.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {!endpoint ? (
              <Card>
                <CardContent className="py-16 text-center text-gray-500">
                  <Code className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium text-gray-900">No endpoint selected</p>
                  <p className="text-sm mt-2">Create an endpoint to start designing your API.</p>
                  <Button className="mt-4" onClick={addNewEndpoint}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Endpoint
                  </Button>
                </CardContent>
              </Card>
            ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="mapping">Prompt Mapping</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="test">Test</TabsTrigger>
              </TabsList>

              <TabsContent value="design" className="space-y-6">
                {/* Endpoint Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle>Endpoint Configuration</CardTitle>
                    <CardDescription>
                      Configure the basic settings for your API endpoint.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="endpoint-name">Endpoint Name</Label>
                        <Input
                          id="endpoint-name"
                          value={endpoint.name}
                          onChange={(e) => updateEndpoint('name', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="http-method">HTTP Method</Label>
                        <Select value={endpoint.method} onValueChange={(value) => updateEndpoint('method', value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {httpMethods.map(method => (
                              <SelectItem key={method} value={method}>{method}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="endpoint-path">Endpoint Path</Label>
                      <Input
                        id="endpoint-path"
                        value={endpoint.path}
                        onChange={(e) => updateEndpoint('path', e.target.value)}
                        className="mt-1"
                        placeholder="/api/your-endpoint"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endpoint-description">Description</Label>
                      <Textarea
                        id="endpoint-description"
                        value={endpoint.description}
                        onChange={(e) => updateEndpoint('description', e.target.value)}
                        className="mt-1"
                        placeholder="Describe what this endpoint does..."
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Request Schema */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Request Schema
                      <Button size="sm" variant="outline" onClick={addRequestField}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Field
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Define the structure of incoming requests to your API.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {endpoint.requestFields.map((field, index) => (
                        <div key={index} className="flex items-end space-x-3 p-4 border rounded-lg">
                          <div className="flex-1 grid grid-cols-4 gap-3">
                            <div>
                              <Label className="text-xs">Field Name</Label>
                              <Input
                                value={field.name}
                                onChange={(e) => updateRequestField(index, 'name', e.target.value)}
                                placeholder="fieldName"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Type</Label>
                              <Select
                                value={field.type}
                                onValueChange={(value) => updateRequestField(index, 'type', value)}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {fieldTypes.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Required</Label>
                              <div className="mt-1 flex items-center h-10">
                                <Switch
                                  checked={field.required}
                                  onCheckedChange={(checked) => updateRequestField(index, 'required', checked)}
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Description</Label>
                              <Input
                                value={field.description}
                                onChange={(e) => updateRequestField(index, 'description', e.target.value)}
                                placeholder="Field description"
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeRequestField(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      {endpoint.requestFields.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No request fields defined yet.</p>
                          <p className="text-sm">Add fields to define your API request structure.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Response Schema */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Response Schema
                      <Button size="sm" variant="outline" onClick={addResponseField}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Field
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Define the structure of responses from your API.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {endpoint.responseFields.map((field, index) => (
                        <div key={index} className="flex items-end space-x-3 p-4 border rounded-lg">
                          <div className="flex-1 grid grid-cols-4 gap-3">
                            <div>
                              <Label className="text-xs">Field Name</Label>
                              <Input
                                value={field.name}
                                onChange={(e) => updateResponseField(index, 'name', e.target.value)}
                                placeholder="fieldName"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Type</Label>
                              <Select
                                value={field.type}
                                onValueChange={(value) => updateResponseField(index, 'type', value)}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {fieldTypes.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Required</Label>
                              <div className="mt-1 flex items-center h-10">
                                <Switch
                                  checked={field.required}
                                  onCheckedChange={(checked) => updateResponseField(index, 'required', checked)}
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Description</Label>
                              <Input
                                value={field.description}
                                onChange={(e) => updateResponseField(index, 'description', e.target.value)}
                                placeholder="Field description"
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeResponseField(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      {endpoint.responseFields.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No response fields defined yet.</p>
                          <p className="text-sm">Add fields to define your API response structure.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="mapping" className="space-y-6">
                {/* Prompt Mapping */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ArrowRight className="w-5 h-5 mr-2" />
                      Prompt Mapping
                    </CardTitle>
                    <CardDescription>
                      Connect your API endpoint to a prompt and define how data flows between them.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="prompt-select">Select Prompt</Label>
                      <Select
                        value={endpoint.promptId || undefined}
                        onValueChange={(value) => updateEndpoint('promptId', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose a prompt to connect" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingPrompts ? (
                            <SelectItem value="__loading" disabled>
                              Loading prompts...
                            </SelectItem>
                          ) : availablePrompts.length === 0 ? (
                            <SelectItem value="__empty" disabled>
                              No prompts available
                            </SelectItem>
                          ) : (
                            availablePrompts.map((prompt) => (
                              <SelectItem key={prompt.id} value={prompt.id}>
                                {prompt.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {!loadingPrompts && availablePrompts.length === 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          <Link href="/prompt-studio" className="text-blue-600 hover:underline">
                            Go to Prompt Studio
                          </Link>{' '}
                          to create your first prompt.
                        </p>
                      )}
                    </div>

                    {endpoint.promptId && (
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-6 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-4">Data Flow Mapping</h4>
                          <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                              <div className="flex-1 bg-white p-3 rounded border">
                                <div className="text-xs text-gray-500 mb-2">API Request Fields</div>
                                {endpoint.requestFields.map((field, index) => (
                                  <div key={index} className="flex items-center justify-between py-1">
                                    <span className="text-sm font-mono">{field.name}</span>
                                    <Badge variant="outline">{field.type}</Badge>
                                  </div>
                                ))}
                              </div>
                              <div className="flex-shrink-0">
                                <ArrowRight className="w-6 h-6 text-gray-400" />
                              </div>
                              <div className="flex-1 bg-white p-3 rounded border">
                                <div className="text-xs text-gray-500 mb-2">Prompt Variables</div>
                                {selectedPromptVariables.length === 0 ? (
                                  <p className="text-sm text-gray-500">No variables defined for this prompt.</p>
                                ) : (
                                  <div className="space-y-1">
                                    {selectedPromptVariables.map((variable) => (
                                      <div key={variable.name} className="flex items-center justify-between py-1">
                                        <span className="text-sm font-mono">{variable.name}</span>
                                        <Badge variant="outline">{variable.type}</Badge>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-center">
                              <ArrowDown className="w-6 h-6 text-gray-400" />
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="flex-1 bg-white p-3 rounded border">
                                <div className="text-xs text-gray-500 mb-2">AI Response</div>
                                <div className="text-sm font-mono text-gray-600">Generated content...</div>
                              </div>
                              <div className="flex-shrink-0">
                                <ArrowRight className="w-6 h-6 text-gray-400" />
                              </div>
                              <div className="flex-1 bg-white p-3 rounded border">
                                <div className="text-xs text-gray-500 mb-2">API Response Fields</div>
                                {endpoint.responseFields.map((field, index) => (
                                  <div key={index} className="flex items-center justify-between py-1">
                                    <span className="text-sm font-mono">{field.name}</span>
                                    <Badge variant="outline">{field.type}</Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900">Response Processing</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-sm font-medium">Include Metadata</Label>
                                <p className="text-xs text-gray-500">Add execution time, token usage, etc.</p>
                              </div>
                              <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-sm font-medium">Content Filtering</Label>
                                <p className="text-xs text-gray-500">Apply content safety filters to responses</p>
                              </div>
                              <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-sm font-medium">Response Caching</Label>
                                <p className="text-xs text-gray-500">Cache similar requests for better performance</p>
                              </div>
                              <Switch />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                {/* Security Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      Security & Authentication
                    </CardTitle>
                    <CardDescription>
                      Configure security settings and authentication methods for your API.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="auth-method">Authentication Method</Label>
                      <Select
                        value={endpoint.authentication}
                        onValueChange={(value) => updateEndpoint('authentication', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="api-key">API Key</SelectItem>
                          <SelectItem value="bearer-token">Bearer Token</SelectItem>
                          <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                          <SelectItem value="none">No Authentication</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {endpoint.authentication === 'api-key' && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Key className="w-5 h-5 text-blue-600 mr-2" />
                          <h4 className="font-medium text-blue-900">API Key Configuration</h4>
                        </div>
                        <p className="text-sm text-blue-700 mb-3">
                          Clients will need to include an API key in the request headers.
                        </p>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm">Header Name</Label>
                            <Input defaultValue="X-API-Key" className="mt-1" />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-sm font-medium">Key Rotation</Label>
                              <p className="text-xs text-gray-600">Automatically rotate API keys</p>
                            </div>
                            <Switch />
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="rate-limit">Rate Limiting (requests per hour)</Label>
                      <Input
                        id="rate-limit"
                        type="number"
                        value={endpoint.rateLimit}
                        onChange={(e) => updateEndpoint('rateLimit', parseInt(e.target.value, 10) || 0)}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Set to 0 for unlimited requests
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Additional Security Settings</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">CORS Protection</Label>
                            <p className="text-xs text-gray-500">Control cross-origin requests</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Request Validation</Label>
                            <p className="text-xs text-gray-500">Validate request schema before processing</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">IP Whitelisting</Label>
                            <p className="text-xs text-gray-500">Restrict access to specific IP addresses</p>
                          </div>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Request Logging</Label>
                            <p className="text-xs text-gray-500">Log all API requests for monitoring</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="test" className="space-y-6">
                {/* API Testing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Play className="w-5 h-5 mr-2" />
                        Test API Endpoint
                      </div>
                      <Button onClick={testEndpoint} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                        <Play className="w-4 h-4 mr-2" />
                        Send Test Request
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Test your API endpoint with sample data to ensure it works correctly.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Request */}
                      <div>
                        <Label className="text-sm font-medium">Test Request</Label>
                        <div className="mt-1 space-y-2">
                          <div className="flex items-center space-x-2 text-sm">
                            <Badge variant="default">{endpoint.method}</Badge>
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {getDeploymentPreviewUrl(endpoint.path, 'production')}
                            </code>
                          </div>
                          <Textarea
                            placeholder="Enter test request JSON..."
                            value={testRequest}
                            onChange={(e) => setTestRequest(e.target.value)}
                            className="min-h-[200px] font-mono text-sm"
                          />
                        </div>
                      </div>

                      {/* Response */}
                      <div>
                        <Label className="text-sm font-medium">Response</Label>
                        <div className="mt-1">
                          <div className="bg-gray-900 text-green-400 p-4 rounded-lg min-h-[200px] font-mono text-sm whitespace-pre-wrap">
                            {testResponse || 'Click "Send Test Request" to see the response...'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Request Examples */}
                    <div>
                      <Label className="text-sm font-medium">Example Requests</Label>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium text-sm mb-2">cURL</h4>
                          <code className="text-xs bg-gray-100 p-2 rounded block">
                            {`curl -X ${endpoint.method} \\
  ${getDeploymentPreviewUrl(endpoint.path, 'production')} \\
  -H "X-API-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(
                              endpoint.requestFields.reduce((acc, field) => {
                                acc[field.name] = field.type === 'string' ? 'example value' : 
                                                  field.type === 'number' ? 42 : 
                                                  field.type === 'boolean' ? true : 'value';
                                return acc;
                              }, {} as any), null, 2)}'`}
                          </code>
                        </div>
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium text-sm mb-2">JavaScript</h4>
                          <code className="text-xs bg-gray-100 p-2 rounded block">
                            {`const response = await fetch('${getDeploymentPreviewUrl(endpoint.path, 'production')}', {
  method: '${endpoint.method}',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(${JSON.stringify(
                              endpoint.requestFields.reduce((acc, field) => {
                                acc[field.name] = field.type === 'string' ? 'example value' : 
                                                  field.type === 'number' ? 42 : 
                                                  field.type === 'boolean' ? true : 'value';
                                return acc;
                              }, {} as any), null, 2)})
});`}
                          </code>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}