'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft,
  Rocket,
  Globe,
  Activity,
  Settings,
  Play,
  Pause,
  Trash2,
  Copy,
  ExternalLink,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';

interface Deployment {
  id: string;
  name: string;
  url: string;
  status: 'deployed' | 'building' | 'failed' | 'paused';
  environment: 'production' | 'staging' | 'development';
  version: string;
  lastDeployed: string;
  requests: number;
  uptime: number;
  region: string;
  domain?: string;
}

export default function Deployments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [environmentFilter, setEnvironmentFilter] = useState('all');

  const deployments: Deployment[] = [
    {
      id: '1',
      name: 'Content Generator API',
      url: 'https://api-content-gen-prod.promptpilot.com',
      status: 'deployed',
      environment: 'production',
      version: 'v2.1.0',
      lastDeployed: '2 hours ago',
      requests: 12459,
      uptime: 99.9,
      region: 'us-east-1',
      domain: 'content.myapp.com'
    },
    {
      id: '2',
      name: 'Sentiment Analyzer',
      url: 'https://api-sentiment-prod.promptpilot.com',
      status: 'deployed',
      environment: 'production',
      version: 'v1.3.2',
      lastDeployed: '1 day ago',
      requests: 8234,
      uptime: 99.8,
      region: 'us-west-2'
    },
    {
      id: '3',
      name: 'Text Summarizer',
      url: 'https://api-summarizer-staging.promptpilot.com',
      status: 'building',
      environment: 'staging',
      version: 'v1.0.0-beta',
      lastDeployed: '5 minutes ago',
      requests: 0,
      uptime: 0,
      region: 'eu-west-1'
    },
    {
      id: '4',
      name: 'Image Classifier',
      url: 'https://api-classifier-prod.promptpilot.com',
      status: 'deployed',
      environment: 'production',
      version: 'v3.0.1',
      lastDeployed: '3 days ago',
      requests: 5678,
      uptime: 99.5,
      region: 'ap-southeast-1'
    },
    {
      id: '5',
      name: 'Email Assistant',
      url: 'https://api-email-dev.promptpilot.com',
      status: 'paused',
      environment: 'development',
      version: 'v0.9.0',
      lastDeployed: '1 week ago',
      requests: 156,
      uptime: 95.0,
      region: 'us-east-1'
    },
    {
      id: '6',
      name: 'Code Reviewer',
      url: 'https://api-code-review-prod.promptpilot.com',
      status: 'failed',
      environment: 'production',
      version: 'v1.2.0',
      lastDeployed: '6 hours ago',
      requests: 2341,
      uptime: 98.7,
      region: 'eu-central-1'
    }
  ];

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

  const filteredDeployments = deployments.filter(deployment => {
    const matchesSearch = deployment.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || deployment.status === statusFilter;
    const matchesEnvironment = environmentFilter === 'all' || deployment.environment === environmentFilter;
    return matchesSearch && matchesStatus && matchesEnvironment;
  });

  const totalDeployments = deployments.length;
  const activeDeployments = deployments.filter(d => d.status === 'deployed').length;
  const totalRequests = deployments.reduce((sum, d) => sum + d.requests, 0);
  const averageUptime = deployments.reduce((sum, d) => sum + d.uptime, 0) / deployments.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                  <p className="text-sm font-medium text-gray-600">Active APIs</p>
                  <p className="text-2xl font-bold text-gray-900">{activeDeployments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-purple-100 rounded-lg">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{totalRequests.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Uptime</p>
                  <p className="text-2xl font-bold text-gray-900">{averageUptime.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
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

        {/* Deployments List */}
        <div className="space-y-4">
          {filteredDeployments.map((deployment) => (
            <Card key={deployment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(deployment.status)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{deployment.name}</h3>
                        <Badge className={getStatusColor(deployment.status)}>
                          {deployment.status}
                        </Badge>
                        <Badge className={getEnvironmentColor(deployment.environment)}>
                          {deployment.environment}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Version {deployment.version}</span>
                        <span>•</span>
                        <span>Last deployed {deployment.lastDeployed}</span>
                        <span>•</span>
                        <span>{deployment.region}</span>
                        {deployment.domain && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600">{deployment.domain}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    {/* Metrics */}
                    <div className="hidden md:flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-gray-900">{deployment.requests.toLocaleString()}</p>
                        <p className="text-gray-500">Requests</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-900">{deployment.uptime}%</p>
                        <p className="text-gray-500">Uptime</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {deployment.status === 'deployed' && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={deployment.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open
                          </a>
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Copy className="w-4 h-4 mr-2" />
                        Copy URL
                      </Button>
                      <Button size="sm" variant="outline">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* URL */}
                <div className="mt-4 flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                    {deployment.url}
                  </code>
                </div>

                {/* Quick Actions for different statuses */}
                {deployment.status === 'failed' && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-800">Deployment failed. Check logs for details.</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          View Logs
                        </Button>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                          Retry Deploy
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {deployment.status === 'building' && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-yellow-600 animate-spin" />
                        <span className="text-sm text-yellow-800">Deployment in progress...</span>
                      </div>
                      <Button size="sm" variant="outline">
                        View Logs
                      </Button>
                    </div>
                  </div>
                )}

                {deployment.status === 'paused' && (
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Pause className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-800">Deployment is paused.</span>
                      </div>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                        <Play className="w-4 h-4 mr-2" />
                        Resume
                      </Button>
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
                  : 'Create your first API deployment to get started.'}
              </p>
              <Button asChild>
                <Link href="/api-designer">
                  <Rocket className="w-4 h-4 mr-2" />
                  Create Deployment
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}