'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Plus, 
  Zap, 
  Code, 
  Rocket, 
  Activity,
  Users,
  DollarSign,
  TrendingUp,
  Bell,
  Settings,
  Menu,
  X,
  Brain,
  Server,
  Clock,
  AlertCircle,
  CheckCircle,
  Globe
} from 'lucide-react';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const stats = [
    {
      title: 'Total APIs',
      value: '12',
      change: '+2 this week',
      icon: Server,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'API Calls',
      value: '24.5K',
      change: '+12% from last month',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Active Users',
      value: '847',
      change: '+5% from last month',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Revenue',
      value: '$2,847',
      change: '+18% from last month',
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  const recentAPIs = [
    {
      name: 'Content Generator',
      status: 'deployed',
      calls: '1.2K',
      lastUpdated: '2 hours ago',
      health: 100
    },
    {
      name: 'Sentiment Analyzer',
      status: 'deployed',
      calls: '856',
      lastUpdated: '1 day ago',
      health: 98
    },
    {
      name: 'Text Summarizer',
      status: 'draft',
      calls: '0',
      lastUpdated: '3 days ago',
      health: 0
    },
    {
      name: 'Image Classifier',
      status: 'deployed',
      calls: '2.3K',
      lastUpdated: '5 hours ago',
      health: 95
    }
  ];

  const activities = [
    {
      action: 'API deployed',
      target: 'Content Generator v2.1',
      time: '2 hours ago',
      icon: Rocket,
      color: 'text-green-600'
    },
    {
      action: 'Prompt updated',
      target: 'Sentiment Analyzer',
      time: '4 hours ago',
      icon: Brain,
      color: 'text-blue-600'
    },
    {
      action: 'High usage alert',
      target: 'Image Classifier',
      time: '6 hours ago',
      icon: AlertCircle,
      color: 'text-orange-600'
    },
    {
      action: 'New user signup',
      target: 'Enterprise Plan',
      time: '1 day ago',
      icon: Users,
      color: 'text-purple-600'
    }
  ];

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, current: true },
    { name: 'Prompt Studio', href: '/prompt-studio', icon: Brain, current: false },
    { name: 'API Designer', href: '/api-designer', icon: Code, current: false },
    { name: 'Deployments', href: '/deployments', icon: Rocket, current: false },
    { name: 'Analytics', href: '/analytics', icon: TrendingUp, current: false },
    { name: 'Settings', href: '/settings', icon: Settings, current: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setSidebarOpen(false)} />
        
        <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">Prompt Pilot</span>
            </div>
            <nav className="mt-8 px-4">
              <div className="space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      item.current
                        ? 'bg-purple-100 text-purple-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${item.current ? 'text-purple-500' : 'text-gray-400'}`} />
                    {item.name}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">Prompt Pilot</span>
              </div>
              <nav className="mt-8 flex-1 px-4">
                <div className="space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        item.current
                          ? 'bg-purple-100 text-purple-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className={`mr-3 h-5 w-5 ${item.current ? 'text-purple-500' : 'text-gray-400'}`} />
                      {item.name}
                    </Link>
                  ))}
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top bar */}
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                  <p className="mt-1 text-sm text-gray-600">Welcome back! Here's what's happening with your APIs.</p>
                </div>
                <div className="flex items-center space-x-4">
                  <Button variant="outline" size="sm">
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                  </Button>
                  <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" asChild>
                    <Link href="/prompt-studio">
                      <Plus className="w-4 h-4 mr-2" />
                      New API
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <Card key={stat.title} className="overflow-hidden">
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
                      <div className="mt-4">
                        <p className="text-sm text-gray-500">{stat.change}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Main content grid */}
              <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Recent APIs */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Recent APIs
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/deployments">View All</Link>
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentAPIs.map((api, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                {api.status === 'deployed' ? (
                                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Code className="w-5 h-5 text-gray-600" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-gray-900">{api.name}</h3>
                                <div className="flex items-center space-x-4 mt-1">
                                  <Badge variant={api.status === 'deployed' ? 'default' : 'secondary'}>
                                    {api.status}
                                  </Badge>
                                  <span className="text-sm text-gray-500">{api.calls} calls</span>
                                  <span className="text-sm text-gray-500">{api.lastUpdated}</span>
                                </div>
                              </div>
                            </div>
                            {api.status === 'deployed' && (
                              <div className="flex items-center space-x-2">
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-900">{api.health}%</div>
                                  <div className="text-xs text-gray-500">Health</div>
                                </div>
                                <Progress value={api.health} className="w-16" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Activity Feed */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {activities.map((activity, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center`}>
                              <activity.icon className={`w-4 h-4 ${activity.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">{activity.action}</span>
                                {' '}
                                <span className="text-gray-600">{activity.target}</span>
                              </p>
                              <p className="text-xs text-gray-500 flex items-center mt-1">
                                <Clock className="w-3 h-3 mr-1" />
                                {activity.time}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-4">
                        View All Activity
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full justify-start" variant="outline" asChild>
                        <Link href="/prompt-studio">
                          <Brain className="w-4 h-4 mr-2" />
                          Create New Prompt
                        </Link>
                      </Button>
                      <Button className="w-full justify-start" variant="outline" asChild>
                        <Link href="/api-designer">
                          <Code className="w-4 h-4 mr-2" />
                          Design API
                        </Link>
                      </Button>
                      <Button className="w-full justify-start" variant="outline" asChild>
                        <Link href="/analytics">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Analytics
                        </Link>
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Globe className="w-4 h-4 mr-2" />
                        Explore Marketplace
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}