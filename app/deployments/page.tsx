'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Rocket,
  Globe,
  Settings,
  Play,
  Pause,
  Copy,
  ExternalLink,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface Deployment {
  id: string;
  name: string;
  url: string;
  status: string;
  environment: string;
  version: string;
  region: string;
  custom_domain?: string | null;
  deployed_at?: string | null;
  error_message?: string | null;
}

interface HealthResult {
  healthy: boolean;
  statusCode: number;
  latencyMs: number;
  error?: string;
}

function formatDeployedAt(value?: string | null): string {
  if (!value) return 'Not deployed yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function Deployments() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [environmentFilter, setEnvironmentFilter] = useState('all');
  const [healthChecks, setHealthChecks] = useState<Record<string, HealthResult>>({});
  const [checkingHealth, setCheckingHealth] = useState<string | null>(null);

  useEffect(() => {
    async function loadDeployments() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/deployments', { credentials: 'include' });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load deployments');
        }

        setDeployments(
          (data.deployments || []).map((d: Record<string, unknown>) => ({
            id: String(d.id),
            name: String(d.name || ''),
            url: String(d.url || ''),
            status: String(d.status || 'building'),
            environment: String(d.environment || 'production'),
            version: String(d.version || 'v1.0.0'),
            region: String(d.region || 'us-east-1'),
            custom_domain: d.custom_domain ? String(d.custom_domain) : null,
            deployed_at: d.deployed_at ? String(d.deployed_at) : null,
            error_message: d.error_message ? String(d.error_message) : null,
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load deployments');
      } finally {
        setLoading(false);
      }
    }

    loadDeployments();
  }, []);

  const runHealthCheck = async (deploymentId: string) => {
    setCheckingHealth(deploymentId);
    try {
      const response = await fetch(`/api/deployments/${deploymentId}/health`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Health check failed');

      setHealthChecks((prev) => ({
        ...prev,
        [deploymentId]: {
          healthy: Boolean(data.healthy),
          statusCode: Number(data.statusCode ?? 0),
          latencyMs: Number(data.latencyMs ?? 0),
          error: data.error ? String(data.error) : undefined,
        },
      }));

      toast[data.healthy ? 'success' : 'error'](
        data.healthy
          ? `Healthy (${data.latencyMs}ms)`
          : data.error || `Unhealthy — HTTP ${data.statusCode}`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Health check failed');
    } finally {
      setCheckingHealth(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deployed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'building':
        return <Clock className="w-4 h-4 text-yellow-600 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-gray-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed':
        return 'bg-green-100 text-green-800';
      case 'building':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'paused':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEnvironmentColor = (environment: string) => {
    switch (environment) {
      case 'production':
        return 'bg-blue-100 text-blue-800';
      case 'staging':
        return 'bg-purple-100 text-purple-800';
      case 'development':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDeployments = deployments.filter((deployment) => {
    const matchesSearch = deployment.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || deployment.status === statusFilter;
    const matchesEnvironment =
      environmentFilter === 'all' || deployment.environment === environmentFilter;
    return matchesSearch && matchesStatus && matchesEnvironment;
  });

  const totalDeployments = deployments.length;
  const activeDeployments = deployments.filter((d) => d.status === 'deployed').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
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
                <Rocket className="w-6 h-6 text-green-600" />
                <h1 className="text-xl font-bold text-gray-900">Deployments</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Deployment Settings
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" asChild>
                <Link href="/api-designer">
                  <Rocket className="w-4 h-4 mr-2" />
                  New Deployment
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4 text-sm text-red-800">{error}</CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
                  <Rocket className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Deployments</p>
                  <p className="text-2xl font-bold text-gray-900">{totalDeployments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Deployments</p>
                  <p className="text-2xl font-bold text-gray-900">{activeDeployments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search deployments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="deployed">Deployed</SelectItem>
                    <SelectItem value="building">Building</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Environment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Environments</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredDeployments.map((deployment) => (
            <Card key={deployment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">{getStatusIcon(deployment.status)}</div>
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{deployment.name}</h3>
                        <Badge className={getStatusColor(deployment.status)}>{deployment.status}</Badge>
                        <Badge className={getEnvironmentColor(deployment.environment)}>
                          {deployment.environment}
                        </Badge>
                      </div>
                      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span>Version {deployment.version}</span>
                        <span>•</span>
                        <span>{formatDeployedAt(deployment.deployed_at)}</span>
                        <span>•</span>
                        <span>{deployment.region}</span>
                        {deployment.custom_domain && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600">{deployment.custom_domain}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {deployment.status === 'deployed' && deployment.url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={deployment.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open
                        </a>
                      </Button>
                    )}
                    {deployment.url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void runHealthCheck(deployment.id)}
                        disabled={checkingHealth === deployment.id}
                      >
                        {checkingHealth === deployment.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4 mr-2" />
                        )}
                        Health Check
                      </Button>
                    )}
                    {deployment.url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(deployment.url)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy URL
                      </Button>
                    )}
                  </div>
                </div>

                {deployment.url && (
                  <div className="mt-4 flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                      {deployment.url}
                    </code>
                  </div>
                )}

                {healthChecks[deployment.id] && (
                  <div
                    className={`mt-4 p-3 rounded-lg border ${
                      healthChecks[deployment.id].healthy
                        ? 'bg-green-50 border-green-200'
                        : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <p className="text-sm">
                      {healthChecks[deployment.id].healthy ? (
                        <span className="text-green-800">
                          Health check passed — HTTP {healthChecks[deployment.id].statusCode} in{' '}
                          {healthChecks[deployment.id].latencyMs}ms
                        </span>
                      ) : (
                        <span className="text-amber-800">
                          Health check failed —{' '}
                          {healthChecks[deployment.id].error ||
                            `HTTP ${healthChecks[deployment.id].statusCode}`}
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {deployment.status === 'failed' && deployment.error_message && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-800">{deployment.error_message}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDeployments.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Rocket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No deployments found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || statusFilter !== 'all' || environmentFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Create your first API in the designer, then deploy it here.'}
              </p>
              <Button asChild>
                <Link href="/api-designer">
                  <Rocket className="w-4 h-4 mr-2" />
                  Go to API Designer
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
