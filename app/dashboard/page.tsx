'use client';

import { useState, useEffect } from 'react';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Plus,
  Zap,
  Code,
  Rocket,
  Activity,
  TrendingUp,
  Settings,
  Brain,
  Server,
  Clock,
  CheckCircle,
  Sparkles,
  ArrowUpRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useOrganization } from '@/lib/hooks/useOrganization';
import { toast } from 'sonner';

interface DashboardStats {
  prompts: {
    total: number;
    deployed: number;
    growth: number;
  };
  endpoints: {
    total: number;
    growth: number;
  };
  deployments: {
    total: number;
    active: number;
    growth: number;
  };
  apiCalls: {
    total: number;
    growth: number;
  };
  recent: {
    prompts: any[];
    endpoints: any[];
    deployments: any[];
  };
}

export default function Dashboard() {
  const { currentOrganization, loading: orgLoading } = useOrganization();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrganization?.id) {
      loadDashboardStats();
    }
  }, [currentOrganization]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/stats?organizationId=${currentOrganization?.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load dashboard stats');
      }

      setStats(data.stats);
    } catch (error: any) {
      console.error('Error loading dashboard stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Create Prompt',
      description: 'Build a new AI prompt',
      icon: Brain,
      color: 'from-purple-500 to-pink-500',
      href: '/prompt-studio',
      action: 'Create'
    },
    {
      title: 'Design API',
      description: 'Design a new API endpoint',
      icon: Code,
      color: 'from-blue-500 to-cyan-500',
      href: '/api-designer',
      action: 'Design'
    },
    {
      title: 'View Analytics',
      description: 'Track performance metrics',
      icon: BarChart3,
      color: 'from-green-500 to-emerald-500',
      href: '/analytics',
      action: 'View'
    },
    {
      title: 'Deploy API',
      description: 'Deploy to production',
      icon: Rocket,
      color: 'from-orange-500 to-red-500',
      href: '/deployments',
      action: 'Deploy'
    }
  ];

  if (orgLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-purple-600 mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-600 mb-4" />
          <p className="text-gray-600">No organization found. Please contact support.</p>
        </div>
      </div>
    );
  }

  const mainStats = [
    {
      title: 'Total Prompts',
      value: stats?.prompts.total.toString() || '0',
      change: stats?.prompts.deployed ? `${stats.prompts.deployed} deployed` : 'No deployments',
      icon: Brain,
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      borderColor: 'border-purple-200'
    },
    {
      title: 'API Endpoints',
      value: stats?.endpoints.total.toString() || '0',
      change: 'Ready to deploy',
      icon: Server,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Deployments',
      value: stats?.deployments.total.toString() || '0',
      change: stats?.deployments.active ? `${stats.deployments.active} active` : 'No active',
      icon: Rocket,
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      borderColor: 'border-green-200'
    },
    {
      title: 'Total API Calls',
      value: stats?.apiCalls.total.toLocaleString() || '0',
      change: 'All time',
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
      borderColor: 'border-orange-200'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500">{currentOrganization.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-2xl p-8 mb-8 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Welcome to Prompt Pilot 🚀</h2>
              <p className="text-purple-100 text-lg mb-4">
                Transform your AI prompts into production-ready APIs in minutes
              </p>
              <div className="flex items-center space-x-4">
                <Button
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-purple-50 shadow-lg hover:shadow-xl transition-all duration-300"
                  asChild
                >
                  <Link href="/prompt-studio">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Prompt
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="/analytics">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    View Analytics
                  </Link>
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <Sparkles className="w-32 h-32 text-white/30" />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {mainStats.map((stat, index) => (
            <Card key={index} className={`border-2 ${stat.borderColor} shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden`}>
              <CardContent className="p-6">
                <div className={`${stat.bgColor} rounded-xl p-4 mb-4`}>
                  <div className="flex items-center justify-between">
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                    <TrendingUp className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.change}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className="border-2 border-gray-100 hover:border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                      {action.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                    <div className="flex items-center text-sm font-medium text-purple-600 group-hover:text-purple-700">
                      {action.action} Now
                      <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Prompts */}
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center">
                <Brain className="w-5 h-5 mr-2 text-purple-600" />
                Recent Prompts
              </CardTitle>
              <CardDescription>Your latest AI prompts</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {stats?.recent.prompts && stats.recent.prompts.length > 0 ? (
                <div className="space-y-4">
                  {stats.recent.prompts.map((prompt) => (
                    <Link key={prompt.id} href={`/prompt-studio?promptId=${prompt.id}`}>
                      <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{prompt.name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {prompt.model}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(prompt.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Badge className={prompt.status === 'deployed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {prompt.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 mb-4">No prompts yet</p>
                  <Button asChild>
                    <Link href="/prompt-studio">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Prompt
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Endpoints */}
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center">
                <Code className="w-5 h-5 mr-2 text-blue-600" />
                Recent API Endpoints
              </CardTitle>
              <CardDescription>Your latest API designs</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {stats?.recent.endpoints && stats.recent.endpoints.length > 0 ? (
                <div className="space-y-4">
                  {stats.recent.endpoints.map((endpoint) => (
                    <Link key={endpoint.id} href={`/api-designer?endpointId=${endpoint.id}`}>
                      <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{endpoint.name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {endpoint.method}
                            </Badge>
                            <code className="text-xs text-gray-600">{endpoint.path}</code>
                          </div>
                        </div>
                        <Clock className="w-4 h-4 text-gray-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Code className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 mb-4">No API endpoints yet</p>
                  <Button asChild>
                    <Link href="/api-designer">
                      <Plus className="w-4 h-4 mr-2" />
                      Design Your First API
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Deployments */}
        {stats?.recent.deployments && stats.recent.deployments.length > 0 && (
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center">
                <Rocket className="w-5 h-5 mr-2 text-green-600" />
                Recent Deployments
              </CardTitle>
              <CardDescription>Your latest production deployments</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {stats.recent.deployments.map((deployment) => (
                  <div key={deployment.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <Rocket className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{deployment.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {deployment.environment}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {deployment.deployed_at ? new Date(deployment.deployed_at).toLocaleDateString() : 'Not deployed'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <Badge className={
                        deployment.status === 'deployed' ? 'bg-green-100 text-green-800' :
                        deployment.status === 'building' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {deployment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
