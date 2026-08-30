'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Sparkles, Wand2, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

interface Variable {
  name: string;
  value?: string;
  type: string;
  description: string;
  default_value?: string;
  required: boolean;
}

interface GenerateResult {
  prompt: string;
  suggested_name: string;
  suggested_description: string;
  variables: Array<{ name: string; description: string; required: boolean }>;
  tips?: string[];
}

interface EnhanceResult {
  prompt: string;
  improvements: string[];
  variables: Array<{ name: string; description: string; required: boolean }>;
}

interface PromptAssistPanelProps {
  prompt: string;
  promptId: string | null;
  onApplyGenerate: (result: {
    prompt: string;
    name?: string;
    description?: string;
    variables: Variable[];
  }) => void;
  onApplyEnhance: (result: { prompt: string; variables: Variable[] }) => void;
}

function toVariables(
  vars: Array<{ name: string; description: string; required: boolean }>
): Variable[] {
  return vars.map((v) => ({
    name: v.name,
    value: '',
    type: 'string',
    description: v.description,
    required: v.required,
  }));
}

export function PromptAssistPanel({
  prompt,
  promptId,
  onApplyGenerate,
  onApplyEnhance,
}: PromptAssistPanelProps) {
  const [generateOpen, setGenerateOpen] = useState(false);
  const [enhanceOpen, setEnhanceOpen] = useState(false);

  const [description, setDescription] = useState('');
  const [useCase, setUseCase] = useState('');
  const [tone, setTone] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [enhanceGoals, setEnhanceGoals] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null);
  const [enhanceResult, setEnhanceResult] = useState<EnhanceResult | null>(null);

  const callAssist = async (payload: Record<string, unknown>) => {
    const response = await fetch('/api/llm/prompt-assist', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        prompt_id: promptId || undefined,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'AI request failed');
    return data;
  };

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error('Describe the prompt you want to create');
      return;
    }

    try {
      setIsGenerating(true);
      setGenerateResult(null);
      const data = await callAssist({
        action: 'generate',
        description: description.trim(),
        use_case: useCase || undefined,
        tone: tone || undefined,
        output_format: outputFormat || undefined,
      });
      if (!data.prompt?.trim()) {
        throw new Error('AI returned an empty prompt');
      }

      setGenerateResult({
        prompt: data.prompt,
        suggested_name: data.suggested_name,
        suggested_description: data.suggested_description,
        variables: data.variables || [],
        tips: data.tips,
      });
      toast.success('Prompt generated!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnhance = async () => {
    if (!prompt.trim()) {
      toast.error('Enter a prompt to enhance first');
      return;
    }

    try {
      setIsEnhancing(true);
      setEnhanceResult(null);
      const data = await callAssist({
        action: 'enhance',
        prompt,
        goals: enhanceGoals || undefined,
      });
      setEnhanceResult(data);
      setEnhanceOpen(true);
      toast.success('Prompt enhanced!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Enhancement failed');
    } finally {
      setIsEnhancing(false);
    }
  };

  const applyGenerate = () => {
    if (!generateResult) return;
    onApplyGenerate({
      prompt: generateResult.prompt,
      name: generateResult.suggested_name,
      description: generateResult.suggested_description,
      variables: toVariables(generateResult.variables || []),
    });
    setGenerateOpen(false);
    setGenerateResult(null);
    setDescription('');
    toast.success('Generated prompt applied');
  };

  const applyEnhance = () => {
    if (!enhanceResult) return;
    onApplyEnhance({
      prompt: enhanceResult.prompt,
      variables: toVariables(enhanceResult.variables || []),
    });
    setEnhanceOpen(false);
    setEnhanceResult(null);
    setEnhanceGoals('');
    toast.success('Enhanced prompt applied');
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="bg-white hover:bg-purple-50 border-purple-200 text-purple-700"
          onClick={() => {
            setGenerateResult(null);
            setGenerateOpen(true);
          }}
        >
          <Lightbulb className="w-4 h-4 mr-2" />
          Text to Prompt
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="bg-white hover:bg-blue-50 border-blue-200 text-blue-700"
          onClick={handleEnhance}
          disabled={isEnhancing || !prompt.trim()}
        >
          {isEnhancing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4 mr-2" />
          )}
          {isEnhancing ? 'Enhancing...' : 'Enhance Prompt'}
        </Button>
      </div>

      {/* Generate dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Text to Prompt
            </DialogTitle>
            <DialogDescription>
              Describe what you want your prompt to do. AI will craft a production-ready prompt
              with variables and best practices built in.
            </DialogDescription>
          </DialogHeader>

          {!generateResult ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="ai-description">What should this prompt do? *</Label>
                <Textarea
                  id="ai-description"
                  placeholder="e.g. Summarize customer support tickets into action items with priority labels..."
                  className="mt-2 min-h-[120px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label>Use case</Label>
                  <Select value={useCase} onValueChange={setUseCase}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="content">Content creation</SelectItem>
                      <SelectItem value="analysis">Analysis</SelectItem>
                      <SelectItem value="coding">Coding</SelectItem>
                      <SelectItem value="support">Customer support</SelectItem>
                      <SelectItem value="data">Data extraction</SelectItem>
                      <SelectItem value="creative">Creative writing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Output format</Label>
                  <Select value={outputFormat} onValueChange={setOutputFormat}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Plain text</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="markdown">Markdown</SelectItem>
                      <SelectItem value="bullets">Bullet list</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Suggested name</Label>
                  <Input value={generateResult.suggested_name} readOnly className="mt-1 bg-gray-50" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={generateResult.suggested_description} readOnly className="mt-1 bg-gray-50" />
                </div>
              </div>
              <div>
                <Label>Generated prompt</Label>
                <Textarea
                  value={generateResult.prompt}
                  readOnly
                  className="mt-1 min-h-[180px] font-mono text-sm bg-gray-50"
                />
              </div>
              {generateResult.tips && generateResult.tips.length > 0 && (
                <div className="text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <p className="font-medium text-amber-800 mb-1">Tips</p>
                  <ul className="list-disc list-inside space-y-1">
                    {generateResult.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {!generateResult ? (
              <>
                <Button variant="outline" onClick={() => setGenerateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  {isGenerating ? 'Generating...' : 'Generate Prompt'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setGenerateResult(null)}>
                  Regenerate
                </Button>
                <Button onClick={applyGenerate}>Apply to Editor</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhance dialog */}
      <Dialog open={enhanceOpen} onOpenChange={setEnhanceOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-blue-600" />
              Enhanced Prompt
            </DialogTitle>
            <DialogDescription>
              Review the improved prompt before applying it to your editor.
            </DialogDescription>
          </DialogHeader>

          {enhanceResult && (
            <div className="space-y-4">
              {enhanceResult.improvements?.length > 0 && (
                <div className="text-sm bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p className="font-medium text-blue-800 mb-2">Improvements made</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-900">
                    {enhanceResult.improvements.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <Label>Enhanced prompt</Label>
                <Textarea
                  value={enhanceResult.prompt}
                  readOnly
                  className="mt-1 min-h-[220px] font-mono text-sm bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="enhance-goals">Focus areas (optional, for next run)</Label>
                <Input
                  id="enhance-goals"
                  placeholder="e.g. make it more concise, add JSON output format..."
                  className="mt-1"
                  value={enhanceGoals}
                  onChange={(e) => setEnhanceGoals(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEnhanceOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleEnhance}
              disabled={isEnhancing}
            >
              {isEnhancing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              Re-enhance
            </Button>
            <Button onClick={applyEnhance}>Apply to Editor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
