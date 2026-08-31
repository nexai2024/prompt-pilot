'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  BarChart3,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Wand2,
  History,
} from 'lucide-react';
import { toast } from 'sonner';
import RadarChart from '@/components/RadarChart';
import { ScoreTrendChart, type ScoreTrendPoint } from '@/components/prompt-studio/ScoreTrendChart';
import type { PromptScoreResult } from '@/lib/prompt-assist';

interface PromptScorePanelProps {
  prompt: string;
  promptName?: string;
  promptDescription?: string;
  promptId?: string | null;
  onApplySuggestions?: (goals: string) => void;
}

function scoreBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (score >= 80) return 'default';
  if (score >= 60) return 'secondary';
  if (score >= 40) return 'outline';
  return 'destructive';
}

function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Needs work';
  return 'Poor';
}

function formatTrendDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function PromptScorePanel({
  prompt,
  promptName,
  promptDescription,
  promptId,
  onApplySuggestions,
}: PromptScorePanelProps) {
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [result, setResult] = useState<PromptScoreResult | null>(null);
  const [trendData, setTrendData] = useState<ScoreTrendPoint[]>([]);
  const [scoreDelta, setScoreDelta] = useState<number | null>(null);

  const loadHistory = useCallback(async () => {
    if (!promptId) {
      setTrendData([]);
      setScoreDelta(null);
      return;
    }

    setHistoryLoading(true);
    try {
      const response = await fetch(`/api/prompts/${promptId}/scores?limit=30`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load score history');

      const scores = (data.scores || []) as Array<{
        id: string;
        overallScore: number;
        clarity: number;
        specificity: number;
        structure: number;
        variables: number;
        robustness: number;
        createdAt: string;
      }>;

      setTrendData(
        scores.map((score) => ({
          id: score.id,
          date: formatTrendDate(score.createdAt),
          overall: score.overallScore,
          clarity: score.clarity,
          specificity: score.specificity,
          structure: score.structure,
          variables: score.variables,
          robustness: score.robustness,
        }))
      );

      if (scores.length >= 2) {
        const latest = scores[scores.length - 1];
        const previous = scores[scores.length - 2];
        setScoreDelta(latest.overallScore - previous.overallScore);
      } else {
        setScoreDelta(null);
      }
    } catch {
      // History is optional — don't block scoring UI
      setTrendData([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [promptId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const runScore = async () => {
    if (!prompt.trim()) {
      toast.error('Add prompt content before scoring');
      return;
    }

    if (!promptId) {
      toast.message('Save your prompt first to track score history over time');
    }

    setLoading(true);
    try {
      const response = await fetch('/api/llm/prompt-assist', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'score',
          prompt: prompt.trim(),
          prompt_name: promptName,
          prompt_description: promptDescription,
          prompt_id: promptId || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Scoring failed');

      setResult(data as PromptScoreResult);
      if (data.saved) {
        toast.success('Prompt scored and saved to history');
        void loadHistory();
      } else {
        toast.success('Prompt scored');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Scoring failed');
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestions = () => {
    if (!result || !onApplySuggestions) return;
    const goals = [...result.improvements, ...result.suggestions].join('\n');
    if (!goals.trim()) {
      toast.error('No suggestions to apply');
      return;
    }
    onApplySuggestions(goals);
    toast.success('Opening AI enhance with score feedback');
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-xl border-0 bg-white">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center justify-between flex-wrap gap-3">
            <span className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
              AI Prompt Score
            </span>
            <div className="flex gap-2">
              {result && onApplySuggestions && (
                <Button variant="outline" onClick={handleApplySuggestions}>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Apply with AI
                </Button>
              )}
              <Button
                onClick={() => void runScore()}
                disabled={loading || !prompt.trim()}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scoring...
                  </>
                ) : (
                  'Score Prompt'
                )}
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Quality score with constructive feedback. Saved prompts track history and trends.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {!result ? (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium text-gray-700 mb-1">No score yet</p>
              <p className="text-sm">
                Run AI scoring to see a radar chart and actionable improvement suggestions.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0 bg-gray-900 rounded-2xl p-4">
                  <RadarChart dimensions={result.dimensions} size={300} />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-5xl font-bold text-gray-900">{result.overall_score}</span>
                    <div>
                      <Badge variant={scoreBadgeVariant(result.overall_score)} className="text-sm">
                        {scoreLabel(result.overall_score)}
                      </Badge>
                      {scoreDelta != null && (
                        <p
                          className={`text-sm mt-1 flex items-center ${
                            scoreDelta >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {scoreDelta >= 0 ? '+' : ''}
                          {scoreDelta} vs previous
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">Overall score / 100</p>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{result.summary}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {result.dimensions.map((dim) => (
                      <div key={dim.label} className="rounded-lg border px-3 py-2 text-center">
                        <p className="text-xs text-gray-500">{dim.label}</p>
                        <p className="text-lg font-semibold" style={{ color: dim.color }}>
                          {dim.score}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {result.strengths.length > 0 && (
                <div>
                  <h4 className="flex items-center text-sm font-semibold text-green-700 mb-2">
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Strengths
                  </h4>
                  <ul className="space-y-2">
                    {result.strengths.map((item, i) => (
                      <li key={i} className="text-sm text-gray-700 pl-4 border-l-2 border-green-400">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.improvements.length > 0 && (
                <div>
                  <h4 className="flex items-center text-sm font-semibold text-amber-700 mb-2">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Constructive criticism
                  </h4>
                  <ul className="space-y-2">
                    {result.improvements.map((item, i) => (
                      <li key={i} className="text-sm text-gray-700 pl-4 border-l-2 border-amber-400">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.suggestions.length > 0 && (
                <div>
                  <h4 className="flex items-center text-sm font-semibold text-indigo-700 mb-2">
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Suggested improvements
                  </h4>
                  <ul className="space-y-2">
                    {result.suggestions.map((item, i) => (
                      <li key={i} className="text-sm text-gray-700 pl-4 border-l-2 border-indigo-400">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {promptId && (
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center text-lg">
              <History className="w-5 h-5 mr-2 text-indigo-600" />
              Score History & Trends
            </CardTitle>
            <CardDescription>
              Track how your prompt quality changes as you iterate.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : (
              <ScoreTrendChart data={trendData} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
