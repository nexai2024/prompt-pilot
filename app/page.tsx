'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Brain,
  FlaskConical,
  Globe,
  LayoutTemplate,
  ListChecks,
  Play,
  Rocket,
  Shield,
  Terminal,
} from 'lucide-react';

const features = [
  {
    href: '/templates',
    icon: LayoutTemplate,
    title: 'Template Gallery',
    description: 'Start from production-ready recipes for support, extraction, coding, and ops.',
  },
  {
    href: '/playground',
    icon: Terminal,
    title: 'API Playground',
    description: 'Send JSON through a prompt-backed endpoint and inspect the live response.',
  },
  {
    href: '/evals',
    icon: ListChecks,
    title: 'Eval Suites',
    description: 'Save test cases and assertions so prompt changes fail in the lab, not in production.',
  },
  {
    href: '/lab',
    icon: FlaskConical,
    title: 'A/B Lab',
    description: 'Run two models or prompt variants against the same input and compare cost and latency.',
  },
  {
    href: '/prompt-studio',
    icon: Brain,
    title: 'Prompt Studio',
    description: 'Version, test, and score prompts with variables, diffs, and assist built in.',
  },
  {
    href: '/deployments',
    icon: Shield,
    title: 'Deploy with keys',
    description: 'Ship tenant URLs, API keys, health checks, and analytics without leaving the workspace.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-grid-fade" />
        <div className="relative mx-auto max-w-4xl text-center">
          <Badge variant="outline" className="mb-6 rounded-full px-3 py-1">
            Prompt ops for production APIs
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Turn prompts into <span className="text-gradient">reliable APIs</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Design, score, compare, and deploy AI endpoints from one studio. Built for teams who
            need more than a chat box.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/dashboard">
                Open workspace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/templates">
                <Play className="mr-2 h-4 w-4" />
                Browse templates
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="features" className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight">Open any of these now</h2>
            <p className="mt-3 text-muted-foreground">
              Templates is public. Playground, evals, and the A/B lab live in the header after you sign in.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Link key={feature.title} href={feature.href} className="block">
                <Card className="h-full border-border/80 bg-card/80 shadow-none transition-colors hover:border-primary">
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-3xl bg-foreground px-8 py-12 text-background sm:flex-row sm:items-center">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Ship the next prompt as an API</h2>
            <p className="mt-2 max-w-xl text-sm text-background/70">
              Templates, A/B lab, evals, and a playground — then one-click deploy.
            </p>
          </div>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/sign-up">
              Create a workspace
              <Rocket className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            Prompt Pilot
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Prompt Pilot</p>
        </div>
      </footer>
    </div>
  );
}
