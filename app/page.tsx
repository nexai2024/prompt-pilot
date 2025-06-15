'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Zap, 
  Code, 
  BarChart3, 
  Shield, 
  Rocket, 
  Brain,
  Check,
  Star,
  Users,
  Globe,
  Layers,
  Sparkles,
  ChevronDown,
  Play,
  Menu,
  X
} from 'lucide-react';

export default function Home() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Brain,
      title: 'AI Prompt Studio',
      description: 'Create, test, and version AI prompts with real-time execution, A/B testing, and intelligent suggestions.',
      color: 'from-purple-500 via-pink-500 to-red-500',
      gradient: 'bg-gradient-to-br from-purple-50 to-pink-50'
    },
    {
      icon: Code,
      title: 'Visual API Builder',
      description: 'Design APIs with our intuitive drag-and-drop interface. No coding required, just pure creativity.',
      color: 'from-blue-500 via-cyan-500 to-teal-500',
      gradient: 'bg-gradient-to-br from-blue-50 to-cyan-50'
    },
    {
      icon: Rocket,
      title: 'One-Click Deployment',
      description: 'Deploy and scale your AI-powered APIs instantly with our managed infrastructure and global CDN.',
      color: 'from-green-500 via-emerald-500 to-teal-500',
      gradient: 'bg-gradient-to-br from-green-50 to-emerald-50'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Monitor performance, track costs, and optimize your AI workflows with detailed insights and predictions.',
      color: 'from-orange-500 via-red-500 to-pink-500',
      gradient: 'bg-gradient-to-br from-orange-50 to-red-50'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Built-in authentication, rate limiting, and secure execution environments with SOC 2 compliance.',
      color: 'from-indigo-500 via-purple-500 to-pink-500',
      gradient: 'bg-gradient-to-br from-indigo-50 to-purple-50'
    },
    {
      icon: Layers,
      title: 'AI Model Marketplace',
      description: 'Access curated AI models or upload your own custom models to our secure, scalable platform.',
      color: 'from-teal-500 via-green-500 to-blue-500',
      gradient: 'bg-gradient-to-br from-teal-50 to-green-50'
    }
  ];

  const pricingTiers = [
    {
      name: 'Starter',
      price: '$29',
      description: 'Perfect for individuals and small projects',
      features: [
        '5 AI APIs',
        '10K API calls/month',
        'Basic prompt studio',
        'Community support',
        'Standard models'
      ],
      popular: false,
      gradient: 'from-gray-50 to-gray-100'
    },
    {
      name: 'Professional',
      price: '$99',
      description: 'Ideal for growing businesses and teams',
      features: [
        '25 AI APIs',
        '100K API calls/month',
        'Advanced prompt studio',
        'Priority support',
        'Premium models',
        'Custom domains',
        'Analytics dashboard'
      ],
      popular: true,
      gradient: 'from-purple-50 via-blue-50 to-cyan-50'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large organizations with specific needs',
      features: [
        'Unlimited APIs',
        'Custom API limits',
        'White-label solution',
        'Dedicated support',
        'Custom models',
        'Advanced security',
        'SLA guarantee'
      ],
      popular: false,
      gradient: 'from-slate-50 to-gray-100'
    }
  ];

  const stats = [
    { value: '10K+', label: 'APIs Deployed', icon: Rocket },
    { value: '500M+', label: 'API Calls', icon: Globe },
    { value: '2K+', label: 'Happy Users', icon: Users },
    { value: '99.9%', label: 'Uptime', icon: Shield }
  ];

  const testimonials = [
    {
      quote: "Prompt Pilot transformed how we build AI features. What used to take weeks now takes hours.",
      author: "Sarah Chen",
      role: "CTO at TechFlow",
      avatar: "SC"
    },
    {
      quote: "The visual API builder is incredible. Our non-technical team can now create powerful AI endpoints.",
      author: "Marcus Rodriguez",
      role: "Product Manager at InnovateCorp",
      avatar: "MR"
    },
    {
      quote: "Best AI platform we've used. The analytics and monitoring features are game-changing.",
      author: "Emily Watson",
      role: "Lead Developer at DataSync",
      avatar: "EW"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrollY > 50 
          ? 'bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Prompt Pilot
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">Features</Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">Pricing</Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">Dashboard</Link>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                <Link href="/dashboard">Get Started</Link>
              </Button>
            </div>

            {/* Mobile menu button */}
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
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-4 space-y-3">
              <Link href="#features" className="block text-gray-600 hover:text-gray-900 transition-colors font-medium">Features</Link>
              <Link href="#pricing" className="block text-gray-600 hover:text-gray-900 transition-colors font-medium">Pricing</Link>
              <Link href="/dashboard" className="block text-gray-600 hover:text-gray-900 transition-colors font-medium">Dashboard</Link>
              <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white" asChild>
                <Link href="/dashboard">Get Started</Link>
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <Badge className="mb-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 px-6 py-2 text-sm font-medium shadow-lg">
            <Sparkles className="w-4 h-4 mr-2" />
            The Future of AI API Development
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
            Build AI APIs
            <span className="block bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Without Code
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            Create, test, and deploy AI-powered APIs in minutes. From prompt to production, 
            our platform handles the complexity so you can focus on innovation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105" asChild>
              <Link href="/dashboard">
                Start Building Free <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-4 text-lg border-2 hover:bg-gray-50 transition-all duration-300">
              <Play className="mr-2 w-5 h-5" />
              Watch Demo
            </Button>
          </div>

          {/* Scroll Indicator */}
          <div className="animate-bounce">
            <ChevronDown className="w-6 h-6 text-gray-400 mx-auto" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-purple-100 text-purple-700 border-purple-200">
              <Sparkles className="w-4 h-4 mr-2" />
              Powerful Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to Build AI APIs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our comprehensive platform provides all the tools and infrastructure 
              to create, deploy, and scale AI-powered APIs with enterprise-grade reliability.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className={`group hover:shadow-2xl transition-all duration-500 border-0 ${feature.gradient} cursor-pointer transform hover:scale-105 relative overflow-hidden`}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                <CardHeader className="text-center pb-4 relative z-10">
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br ${feature.color} flex items-center justify-center transform transition-all duration-500 ${hoveredFeature === index ? 'scale-110 rotate-3' : ''} shadow-xl`}>
                    <feature.icon className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-blue-600 group-hover:bg-clip-text transition-all duration-500">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <CardDescription className="text-center text-gray-600 leading-relaxed text-lg">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-blue-100 text-blue-700 border-blue-200">
              <Users className="w-4 h-4 mr-2" />
              Customer Stories
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Loved by Developers Worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See what our customers are saying about their experience with Prompt Pilot.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 text-lg leading-relaxed mb-6">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.author}</div>
                      <div className="text-gray-600">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-green-100 text-green-700 border-green-200">
              <Zap className="w-4 h-4 mr-2" />
              Simple Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start free and scale as you grow. No hidden fees, no surprises.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <Card 
                key={index}
                className={`relative overflow-hidden transition-all duration-500 hover:shadow-2xl border-2 ${
                  tier.popular 
                    ? 'border-purple-500 scale-105 shadow-xl bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50' 
                    : 'border-gray-200 hover:border-purple-200 bg-white'
                } transform hover:scale-105`}
              >
                {tier.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center py-3 text-sm font-bold">
                    <Star className="inline w-4 h-4 mr-1" />
                    Most Popular
                  </div>
                )}
                
                <CardHeader className={tier.popular ? 'pt-16' : 'pt-8'}>
                  <CardTitle className="text-2xl font-bold text-center text-gray-900">
                    {tier.name}
                  </CardTitle>
                  <div className="text-center py-4">
                    <span className="text-5xl font-bold text-gray-900">{tier.price}</span>
                    {tier.price !== 'Custom' && <span className="text-gray-600 text-lg">/month</span>}
                  </div>
                  <CardDescription className="text-center text-lg">
                    {tier.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="px-8 pb-8">
                  <ul className="space-y-4 mb-8">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full py-3 text-lg font-semibold transition-all duration-300 ${
                      tier.popular 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl' 
                        : 'border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50'
                    }`}
                    variant={tier.popular ? 'default' : 'outline'}
                    asChild
                  >
                    <Link href="/dashboard">
                      {tier.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Ready to Transform Your AI Ideas into APIs?
          </h2>
          <p className="text-xl md:text-2xl mb-12 opacity-90 leading-relaxed">
            Join thousands of developers who are already building the future with Prompt Pilot.
          </p>
          <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105" asChild>
            <Link href="/dashboard">
              Start Your Journey Today <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Prompt Pilot</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                The ultimate platform for building AI-powered APIs without code. Transform your ideas into production-ready APIs in minutes.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-6 text-lg">Product</h3>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/prompt-studio" className="hover:text-white transition-colors">Prompt Studio</Link></li>
                <li><Link href="/api-designer" className="hover:text-white transition-colors">API Designer</Link></li>
                <li><Link href="/analytics" className="hover:text-white transition-colors">Analytics</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-6 text-lg">Company</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-6 text-lg">Support</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Prompt Pilot. All rights reserved. Built with ❤️ for developers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}