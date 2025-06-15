'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Globe,
  Sparkles,
  ArrowUpRight,
  Calendar,
  Filter
} from 'lucide-react';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = [
    {
      title: 'Total APIs',
      value: '12',
      change: '+2 this week',
      trend: 'up',
      icon: Server,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      borderColor: 'border-blue-200'
    },
    {
      title: 'API Calls',
      value: '24.5K',
      change: '+12% from last month',
      trend: 'up',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      borderColor: 'border-green-200'
    },
    {
      title: 'Active Users',
      value: '847',
      change: '+5% from last month',
      trend: 'up',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      borderColor: 'border-purple-200'
    },
    {
      title: 'Revenue',
      value: '$2,847',
      change: '+18% from last month',
      trend: 'up',
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
      borderColor: 'border-orange-200'
    }
  ];

  const recentAPIs = [
    {
      name: 'Content Generator',
      status: 'deployed',
      calls: '1.2K',
      lastUpdated: '2 hours ago',
      health: 100,
      description: 'AI-powered content creation API'
    },
    {
      name: 'Sentiment Analyzer',
      status: 'deployed',
      calls: '856',
      lastUpdated: '1 day ago',
      health: 98,
      description: 'Real-time sentiment analysis'
    },
    {
      name: 'Text Summarizer',
      status: 'draft',
      calls: '0',
      lastUpdated: '3 days ago',
      health: 0,
      description: 'Document summarization service'
    },
    {
      name: 'Image Classifier',
      status: 'deployed',
      calls: '2.3K',
      lastUpdated: '5 hours ago',
      health: 95,
      description: 'Computer vision classification'
    }
  ];

  const activities = [
    {
      action: 'API deployed',
      target: 'Content Generator v2.1',
      time: '2 hours ago',
      icon: Rocket,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      action: 'Prompt updated',
      target: 'Sentiment Analyzer',
      time: '4 hours ago',
      icon: Brain,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      action: 'High usage alert',
      target: 'Image Classifier',
      time: '6 hours ago',
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      action: 'New user signup',
      target: 'Enterprise Plan',
      time: '1 day ago',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setSidebarOpen(false)} />
        
        <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl`}>
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
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">Prompt Pilot</span>
            </div>
            <nav className="mt-8 px-4">
              <div className="space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      item.current
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${item.current ? 'text-white' : 'text-gray-400'}`} />
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
          <div className="flex-1 flex flex-col min-h-0 bg-white shadow-xl">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">Prompt Pilot</span>
              </div>
              <nav className="mt-8 flex-1 px-4">
                <div className="space-y-2">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                        item.current
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className={`mr-3 h-5 w-5 ${item.current ? 'text-white' : 'text-gray-400'}`} />
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
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gradient-to-br from-gray-50 to-white">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        
        <main className="flex-1">
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                  <p className="mt-2 text-gray-600">Welcome back! Here's what's happening with your APIs.</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {currentTime.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <Button variant="outline" size="sm" className="hidden sm:flex">
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                  </Button>
                  <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                    <Link href="/prompt-studio">
                      <Plus className="w-4 h-4 mr-2" />
                      New API
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {stats.map((stat, index) => (
                  <Card key={stat.title} className={`overflow-hidden border-2 ${stat.borderColor} hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 p-4 rounded-2xl ${stat.bgColor} shadow-lg`}>
                          <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                          <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center">
                        <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                        <span className="text-sm font-medium text-green-600">{stat.change}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Main content grid */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Recent APIs */}
                <div className="lg:col-span-2">
                  <Card className="shadow-xl border-0 bg-white">
                    <CardHeader className="border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                            <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                            Recent APIs
                          </CardTitle>
                          <CardDescription className="mt-1">Your latest API deployments and their status</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/deployments" className="flex items-center">
                            View All <ArrowUpRight className="w-4 h-4 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {recentAPIs.map((api, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer group">
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                {api.status === 'deployed' ? (
                                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center shadow-md">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-md">
                                    <Code className="w-6 h-6 text-gray-600" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">{api.name}</h3>
                                <p className="text-sm text-gray-500 mb-2">{api.description}</p>
                                <div className="flex items-center space-x-4">
                                  <Badge variant={api.status === 'deployed' ? 'default' : 'secondary'} className="font-medium">
                                    {api.status}
                                  </Badge>
                                  <span className="text-sm text-gray-500 flex items-center">
                                    <Activity className="w-3 h-3 mr-1" />
                                    {api.calls} calls
                                  </span>
                                  <span className="text-sm text-gray-500 flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {api.lastUpdated}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {api.status === 'deployed' && (
                              <div className="flex items-center space-x-3">
                                <div className="text-right">
                                  <div className="text-lg font-bold text-gray-900">{api.health}%</div>
                                  <div className="text-xs text-gray-500">Health</div>
                                </div>
                                <Progress value={api.health} className="w-20" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Activity Feed */}
                  <Card className="shadow-xl border-0 bg-white">
                    <CardHeader className="border-b border-gray-100">
                      <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-blue-600" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {activities.map((activity, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${activity.bgColor} flex items-center justify-center shadow-md`}>
                              <activity.icon className={`w-5 h-5 ${activity.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900">
                                <span className="font-semibold">{activity.action}</span>
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
                  <Card className="shadow-xl border-0 bg-gradient-to-br from-purple-50 to-blue-50">
                    <CardHeader className="border-b border-purple-100">
                      <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                        <Zap className="w-5 h-5 mr-2 text-purple-600" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3">
                      <Button className="w-full justify-start bg-white hover:bg-gray-50 text-gray-900 border shadow-sm" variant="outline" asChild>
                        <Link href="/prompt-studio">
                          <Brain className="w-4 h-4 mr-2 text-purple-600" />
                          Create New Prompt
                        </Link>
                      </Button>
                      <Button className="w-full justify-start bg-white hover:bg-gray-50 text-gray-900 border shadow-sm" variant="outline" asChild>
                        <Link href="/api-designer">
                          <Code className="w-4 h-4 mr-2 text-blue-600" />
                          Design API
                        </Link>
                      </Button>
                      <Button className="w-full justify-start bg-white hover:bg-gray-50 text-gray-900 border shadow-sm" variant="outline" asChild>
                        <Link href="/analytics">
                          <BarChart3 className="w-4 h-4 mr-2 text-green-600" />
                          View Analytics
                        </Link>
                      </Button>
                      <Button className="w-full justify-start bg-white hover:bg-gray-50 text-gray-900 border shadow-sm" variant="outline">
                        <Globe className="w-4 h-4 mr-2 text-orange-600" />
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