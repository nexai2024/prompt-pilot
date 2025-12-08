'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap,
  Code,
  Rocket,
  BarChart3,
  Shield,
  Globe,
  ArrowRight,
  Check,
  Star,
  Menu,
  X,
  Play,
  Users,
  Clock,
  Lightbulb,
  Target,
  Workflow,
  Database,
  Settings,
  TrendingUp
} from 'lucide-react';

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Code,
      title: 'Visual Prompt Studio',
      description: 'Create, test, and version AI prompts with our intuitive drag-and-drop interface.',
      gradient: 'from-purple-600 to-blue-600'
    },
    {
      icon: Rocket,
      title: 'One-Click Deployment',
      description: 'Deploy your AI-powered APIs instantly with automatic scaling and monitoring.',
      gradient: 'from-blue-600 to-cyan-600'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Track performance, usage patterns, and optimize your AI workflows with detailed insights.',
      gradient: 'from-cyan-600 to-teal-600'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Built-in authentication, rate limiting, and data protection for production workloads.',
      gradient: 'from-teal-600 to-green-600'
    },
    {
      icon: Globe,
      title: 'Global CDN',
      description: 'Low-latency API access worldwide with our distributed edge network.',
      gradient: 'from-green-600 to-yellow-600'
    },
    {
      icon: Workflow,
      title: 'Smart Orchestration',
      description: 'Chain multiple AI models and create complex workflows with conditional logic.',
      gradient: 'from-yellow-600 to-red-600'
    }
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '$29',
      description: 'Perfect for individuals and small projects',
      features: [
        '5 API endpoints',
        '10K requests/month',
        'Basic analytics',
        'Community support',
        '99.9% uptime SLA'
      ],
      popular: false,
      gradient: 'from-gray-600 to-gray-700'
    },
    {
      name: 'Pro',
      price: '$99',
      description: 'Ideal for growing businesses and teams',
      features: [
        '25 API endpoints',
        '100K requests/month',
        'Advanced analytics',
        'Priority support',
        '99.95% uptime SLA',
        'Custom domains',
        'Team collaboration'
      ],
      popular: true,
      gradient: 'from-purple-600 to-blue-600'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large organizations with specific needs',
      features: [
        'Unlimited endpoints',
        'Custom request limits',
        'White-label solution',
        'Dedicated support',
        '99.99% uptime SLA',
        'Advanced security',
        'Custom integrations',
        'On-premise deployment'
      ],
      popular: false,
      gradient: 'from-blue-600 to-purple-600'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'CTO at TechFlow',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
      content: 'Prompt Pilot transformed how we deploy AI features. What used to take weeks now happens in minutes.',
      rating: 5
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Lead Developer at DataCorp',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
      content: 'The visual prompt builder is incredible. Our entire team can now create AI workflows without complex coding.',
      rating: 5
    },
    {
      name: 'Emily Watson',
      role: 'Product Manager at InnovateLab',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400',
      content: 'Best AI platform decision we\'ve made. The analytics help us optimize everything from performance to costs.',
      rating: 5
    }
  ];

  const stats = [
    { value: '50K+', label: 'APIs Deployed' },
    { value: '2M+', label: 'Requests Processed' },
    { value: '99.99%', label: 'Uptime' },
    { value: '150ms', label: 'Avg Response Time' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrollY > 50 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Prompt Pilot
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-purple-600 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-purple-600 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-purple-600 transition-colors">Reviews</a>
              <Button variant="outline" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard">Get Started</Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-200">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <a href="#features" className="block px-3 py-2 text-gray-600 hover:text-purple-600">Features</a>
                <a href="#pricing" className="block px-3 py-2 text-gray-600 hover:text-purple-600">Pricing</a>
                <a href="#testimonials" className="block px-3 py-2 text-gray-600 hover:text-purple-600">Reviews</a>
                <div className="flex space-x-2 px-3 pt-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button size="sm" asChild className="flex-1">
                    <Link href="/dashboard">Get Started</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-8">
              <Lightbulb className="w-4 h-4 mr-2" />
              The future of AI API development is here
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Build, Deploy & Scale{' '}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI-Powered APIs
              </span>{' '}
              in Minutes
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              Transform your AI prompts into production-ready APIs with our visual platform. 
              No complex coding required—just drag, drop, and deploy.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" asChild>
                <Link href="/dashboard">
                  Start Building Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                power your AI
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From prompt creation to production deployment, our platform handles every step 
              of your AI API journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              From idea to API in{' '}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                3 simple steps
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: '01',
                title: 'Design Your Prompts',
                description: 'Use our visual prompt studio to create, test, and optimize your AI prompts with real-time feedback.',
                icon: Target
              },
              {
                step: '02',
                title: 'Build Your API',
                description: 'Map prompts to endpoints, configure authentication, and set up data transformations with our drag-and-drop interface.',
                icon: Settings
              },
              {
                step: '03',
                title: 'Deploy & Scale',
                description: 'One-click deployment to our global infrastructure with automatic scaling and comprehensive monitoring.',
                icon: TrendingUp
              }
            ].map((step, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-purple-600">{step.step}</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Loved by developers{' '}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                worldwide
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              See what our community has to say about building with Prompt Pilot
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic leading-relaxed">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full mr-4 object-cover"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent{' '}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                pricing
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              Choose the perfect plan for your needs. Start free, scale as you grow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative border-0 shadow-lg ${
                plan.popular 
                  ? 'ring-2 ring-purple-600 shadow-purple-200 scale-105' 
                  : 'bg-gradient-to-br from-white to-gray-50'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold text-gray-900">{plan.name}</CardTitle>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    {plan.price !== 'Custom' && <span className="text-gray-600 ml-1">/month</span>}
                  </div>
                  <CardDescription className="text-gray-600">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                        : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                    asChild
                  >
                    <Link href="/dashboard">
                      {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">All plans include a 14-day free trial. No credit card required.</p>
            <p className="text-sm text-gray-500">
              Need a custom solution? <a href="#" className="text-purple-600 hover:underline">Contact our team</a>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to transform your AI ideas into reality?
          </h2>
          <p className="text-xl text-purple-100 mb-8 leading-relaxed">
            Join thousands of developers building the future with Prompt Pilot. 
            Start your free trial today—no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="text-lg px-8 py-4 bg-white text-purple-600 hover:bg-gray-100" asChild>
              <Link href="/dashboard">
                Start Building Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-white text-white hover:bg-white/10">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Prompt Pilot</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                The AI-powered API hosting platform that transforms your prompts into production-ready endpoints.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API Reference</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 Prompt Pilot. All rights reserved. Built with ❤️ for developers worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}