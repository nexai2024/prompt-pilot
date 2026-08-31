'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, BarChart3, Sparkles } from 'lucide-react';
import { PromptScorePanel } from '@/components/prompt-studio/PromptScorePanel';

export default function PromptScorerPage() {
  const [promptName, setPromptName] = useState('');
  const [promptDescription, setPromptDescription] = useState('');
  const [prompt, setPrompt] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-900">Prompt Scorer</h1>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/prompt-studio">
              <Sparkles className="w-4 h-4 mr-2" />
              Open in Studio
            </Link>
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Score any prompt</CardTitle>
            <CardDescription>
              Paste a prompt for instant AI quality analysis. Save in Prompt Studio to track score
              history over time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="scorer-name">Name (optional)</Label>
              <Input
                id="scorer-name"
                className="mt-1"
                placeholder="Customer support classifier"
                value={promptName}
                onChange={(e) => setPromptName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="scorer-desc">Description (optional)</Label>
              <Input
                id="scorer-desc"
                className="mt-1"
                placeholder="What should this prompt accomplish?"
                value={promptDescription}
                onChange={(e) => setPromptDescription(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="scorer-prompt">Prompt text</Label>
              <Textarea
                id="scorer-prompt"
                className="mt-1 min-h-[220px] font-mono text-sm"
                placeholder="Paste your prompt here..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <PromptScorePanel
          prompt={prompt}
          promptName={promptName}
          promptDescription={promptDescription}
        />
      </div>
    </div>
  );
}
