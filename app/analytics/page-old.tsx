'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  DollarSign,
  Clock,
  Globe,
  AlertCircle,
  CheckCircle,
  Zap,
  Download,
  Calendar,
  Filter
} from 'lucide-react';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedAPI, setSelectedAPI] = useState('all');

  const timeRanges = [
    { value: '1d', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' }
  ];

  const apis = [
    { value: 'all', label: 'All APIs' },
    { value: 'content-generator', label: 'Content Generator' },
    { value: 'sentiment-analyzer', label: 'Sentiment Analyzer' },
    { value: 'image-classifier', label: 'Image Classifier' },
    { value: 'text-summarizer', label: 'Text Summarizer' }
  ];

  const overviewStats = [
    {
      title: 'Total Requests',
      value: '28,459',
      change: '+12.5%',
      trend: 'up',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Active Users',
      value: '1,247',
      change: '+8.2%',
      trend: 'up',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Revenue',
      value: '$4,892',
      change: '+15.3%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Avg Response Time',
      value: '245ms',
      change: '-5.8%',
      trend: 'down',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  const topAPIs = [
    {
      name: 'Content Generator',
      requests: 12459,
      revenue: '$2,348',
      uptime: 99.9,
      avgResponseTime: '230ms',
      status: 'healthy'
    },
    {
      name: 'Sentiment Analyzer',
      requests: 8234,
      revenue: '$1,567',
      uptime: 99.8,
      avgResponseTime: '180ms',
      status: 'healthy'
    },
    {
      name: 'Image Classifier',
      requests: 5678,
      revenue: '$789',
      uptime: 99.5,
      avgResponseTime: '420ms',
      status: 'warning'
    },
    {
      name: 'Text Summarizer',
      requests: 2088,
      revenue: '$188',
      uptime: 98.2,
      avgResponseTime: '310ms',
      status: 'healthy'
    }
  ];

  const recentAlerts = [
    {
      type: 'warning',
      message: 'Image Classifier API response time increased by 25%',
      time: '2 hours ago',
      api: 'Image Classifier'
    },
    {
      type: 'info',
      message: 'Content Generator reached 10K requests milestone',
      time: '4 hours ago',
      api: 'Content Generator'
    },
    {
      type: 'error',
      message: 'Text Summarizer API had 3 failed requests',
      time: '6 hours ago',
      api: 'Text Summarizer'
    },
    {
      type: 'success',
      message: 'Sentiment Analyzer API uptime improved to 99.8%',
      time: '8 hours ago',
      api: 'Sentiment Analyzer'
    }
  ];

  const usageByRegion = [
    { region: 'North America', requests: 12459, percentage: 43.8 },
    { region: 'Europe', requests: 8234, percentage: 28.9 },
    { region: 'Asia Pacific', requests: 5678, percentage: 19.9 },
    { region: 'South America', requests: 1567, percentage: 5.5 },
    { region: 'Africa', requests: 521, percentage: 1.8 }
  ];

  const errorTypes = [
    { type: '4xx Client Errors', count: 234, percentage: 45.2 },
    { type: '5xx Server Errors', count: 156, percentage: 30.1 },
    { type: 'Timeout Errors', count: 89, percentage: 17.2 },
    { type: 'Rate Limit Exceeded', count: 39, percentage: 7.5 }
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Activity className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
                <BarChart3 className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Select value={selectedAPI} onValueChange={setSelectedAPI}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {apis.map(api => (
                    <SelectItem key={api.value} value={api.value}>{api.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeRanges.map(range => (
                    <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {overviewStats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  {stat.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last period</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
            <TabsTrigger value="costs">Costs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performing APIs */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing APIs</CardTitle>
                  <CardDescription>Your most active APIs in the selected time period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topAPIs.map((api, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                              <Zap className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{api.name}</h4>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm text-gray-500">{api.requests.toLocaleString()} requests</span>
                              <Badge className={getStatusColor(api.status)}>
                                {api.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{api.revenue}</p>
                          <p className="text-sm text-gray-500">{api.uptime}% uptime</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Alerts</CardTitle>
                  <CardDescription>Important notifications about your APIs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentAlerts.map((alert, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0 mt-0.5">
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{alert.message}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">{alert.time}</span>
                            <span className="text-xs text-gray-300">•</span>
                            <span className="text-xs text-gray-500">{alert.api}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    View All Alerts
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Usage by Region */}
            <Card>
              <CardHeader>
                <CardTitle>Usage by Region</CardTitle>
                <CardDescription>Geographic distribution of your API requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usageByRegion.map((region, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{region.region}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                            style={{ width: `${region.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-16 text-right">
                          {region.requests.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500 w-12 text-right">
                          {region.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Response Time Trends</CardTitle>
                  <CardDescription>Average response times over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Response time chart would be displayed here</p>
                      <p className="text-sm">Integration with charting library needed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Throughput Analysis</CardTitle>
                  <CardDescription>Requests per minute over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Throughput chart would be displayed here</p>
                      <p className="text-sm">Integration with charting library needed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics by API</CardTitle>
                <CardDescription>Detailed performance breakdown for each API</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">API Name</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Avg Response Time</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">P95 Response Time</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Uptime</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Error Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topAPIs.map((api, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-3 px-4 text-gray-900">{api.name}</td>
                          <td className="py-3 px-4 text-gray-600">{api.avgResponseTime}</td>
                          <td className="py-3 px-4 text-gray-600">{parseInt(api.avgResponseTime) * 1.5}ms</td>
                          <td className="py-3 px-4">
                            <Badge className={api.uptime > 99 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {api.uptime}%
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-600">0.{Math.floor(Math.random() * 9)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Request Volume</CardTitle>
                  <CardDescription>API requests over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Request volume chart would be displayed here</p>
                      <p className="text-sm">Integration with charting library needed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Activity</CardTitle>
                  <CardDescription>Active users and sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>User activity chart would be displayed here</p>
                      <p className="text-sm">Integration with charting library needed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top Endpoints</CardTitle>
                <CardDescription>Most frequently accessed API endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { endpoint: '/api/generate-content', requests: 8234, method: 'POST' },
                    { endpoint: '/api/analyze-sentiment', requests: 6789, method: 'POST' },
                    { endpoint: '/api/classify-image', requests: 4567, method: 'POST' },
                    { endpoint: '/api/summarize-text', requests: 3456, method: 'POST' },
                    { endpoint: '/api/review-code', requests: 2345, method: 'POST' }
                  ].map((endpoint, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{endpoint.method}</Badge>
                        <code className="text-sm font-mono">{endpoint.endpoint}</code>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-gray-900">{endpoint.requests.toLocaleString()}</span>
                        <span className="text-sm text-gray-500 ml-2">requests</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Error Rate Trends</CardTitle>
                  <CardDescription>Error rates over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Error rate chart would be displayed here</p>
                      <p className="text-sm">Integration with charting library needed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Error Types Distribution</CardTitle>
                  <CardDescription>Breakdown of error types</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {errorTypes.map((error, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{error.type}</span>
                        <div className="flex items-center space-x-4">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full"
                              style={{ width: `${error.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">{error.count}</span>
                          <span className="text-sm text-gray-500 w-12 text-right">{error.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Errors</CardTitle>
                <CardDescription>Latest error occurrences across your APIs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { api: 'Content Generator', error: '500 Internal Server Error', time: '2 minutes ago', count: 3 },
                    { api: 'Image Classifier', error: '429 Rate Limit Exceeded', time: '15 minutes ago', count: 12 },
                    { api: 'Sentiment Analyzer', error: '400 Bad Request', time: '1 hour ago', count: 5 },
                    { api: 'Text Summarizer', error: '503 Service Unavailable', time: '2 hours ago', count: 2 }
                  ].map((error, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{error.api}</p>
                          <p className="text-sm text-gray-600">{error.error}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{error.count} errors</p>
                        <p className="text-sm text-gray-500">{error.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costs" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cost Trends</CardTitle>
                  <CardDescription>API usage costs over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Cost trends chart would be displayed here</p>
                      <p className="text-sm">Integration with charting library needed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cost Breakdown</CardTitle>
                  <CardDescription>Costs by API and resource type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topAPIs.map((api, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{api.name}</p>
                          <p className="text-sm text-gray-500">{api.requests.toLocaleString()} requests</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{api.revenue}</p>
                          <p className="text-sm text-gray-500">
                            ${(parseFloat(api.revenue.replace('$', '').replace(',', '')) * 0.3).toFixed(0)} costs
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
                <CardDescription>Detailed breakdown of resource consumption</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">2.4M</div>
                    <div className="text-sm text-gray-500">AI Model Tokens</div>
                    <div className="text-sm text-green-600">$1,234 cost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">156GB</div>
                    <div className="text-sm text-gray-500">Bandwidth Used</div>
                    <div className="text-sm text-green-600">$89 cost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">1,247</div>
                    <div className="text-sm text-gray-500">Compute Hours</div>
                    <div className="text-sm text-green-600">$567 cost</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}