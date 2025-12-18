'use client';

import { useState, useEffect } from 'react';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  BarChart3,
  Activity,
  Clock,
  TrendingUp,
  DollarSign,
  Zap,
  AlertCircle,
  CheckCircle,
  Globe,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface AnalyticsData {
  overview: {
    totalCalls: number;
    successfulCalls: number;
    errorCalls: number;
    successRate: number;
    avgResponseTime: number;
    totalTokens: number;
    totalCost: number;
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  timeSeries: Array<{
    time: string;
    calls: number;
    tokens: number;
    cost: number;
    avgResponseTime: number;
  }>;
  statusCodeData: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  regionData: Array<{
    region: string;
    count: number;
    percentage: number;
  }>;
  recentErrors: Array<{
    id: string;
    path: string;
    status_code: number;
    error_message: string;
    created_at: string;
  }>;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('7d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/analytics?timeRange=${timeRange}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load analytics');
      }

      setData(result);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-purple-600 mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const overview = data?.overview || {
    totalCalls: 0,
    successfulCalls: 0,
    errorCalls: 0,
    successRate: 0,
    avgResponseTime: 0,
    totalTokens: 0,
    totalCost: 0,
    p50ResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0
  };

  const stats = [
    {
      title: 'Total API Calls',
      value: overview.totalCalls.toLocaleString(),
      change: `${overview.successRate.toFixed(1)}% success rate`,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Avg Response Time',
      value: `${overview.avgResponseTime}ms`,
      change: `P95: ${overview.p95ResponseTime}ms`,
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Tokens',
      value: overview.totalTokens.toLocaleString(),
      change: `Across all calls`,
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Total Cost',
      value: `$${overview.totalCost.toFixed(2)}`,
      change: `Average per call`,
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
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
                <BarChart3 className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={loadAnalytics}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className={`${stat.bgColor} rounded-xl p-4 mb-4`}>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
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

        {/* Charts Grid */}
        {overview.totalCalls > 0 ? (
          <>
            {/* Time Series Chart */}
            <Card className="mb-8 shadow-lg border-0">
              <CardHeader>
                <CardTitle>API Calls Over Time</CardTitle>
                <CardDescription>Request volume and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data?.timeSeries || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="calls"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="API Calls"
                    />
                    <Line
                      type="monotone"
                      dataKey="avgResponseTime"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Avg Response Time (ms)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Status Code Distribution */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Status Code Distribution</CardTitle>
                  <CardDescription>Response status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={data?.statusCodeData || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, percentage }) =>
                          `${status}: ${percentage.toFixed(1)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {(data?.statusCodeData || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Regions */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Top Regions</CardTitle>
                  <CardDescription>Geographic distribution of requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data?.regionData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="region" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Token Usage & Cost */}
            <Card className="mb-8 shadow-lg border-0">
              <CardHeader>
                <CardTitle>Token Usage & Cost</CardTitle>
                <CardDescription>Resource consumption over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data?.timeSeries || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" stroke="#888" />
                    <YAxis yAxisId="left" stroke="#888" />
                    <YAxis yAxisId="right" orientation="right" stroke="#888" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="tokens"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Tokens Used"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="cost"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name="Cost ($)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Errors */}
            {data?.recentErrors && data.recentErrors.length > 0 && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
                    Recent Errors
                  </CardTitle>
                  <CardDescription>Last 10 failed requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.recentErrors.map((error) => (
                      <div
                        key={error.id}
                        className="flex items-center justify-between p-4 border border-red-100 rounded-lg bg-red-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="outline" className="bg-red-100 text-red-800">
                              {error.status_code}
                            </Badge>
                            <code className="text-sm text-gray-700">{error.path}</code>
                          </div>
                          {error.error_message && (
                            <p className="text-sm text-red-700">{error.error_message}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(error.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card className="shadow-lg border-0">
            <CardContent className="p-12 text-center">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
              <p className="text-gray-500 mb-6">
                Start making API calls to see analytics data here. Create and test prompts in the Prompt Studio.
              </p>
              <Button asChild>
                <Link href="/prompt-studio">
                  <Zap className="w-4 h-4 mr-2" />
                  Create Your First Prompt
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
