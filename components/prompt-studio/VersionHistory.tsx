'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, RotateCcw, Clock, User, Check } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface PromptVersion {
  id: string;
  prompt_id: string;
  version_number: number;
  content: string;
  model: string;
  temperature: number;
  max_tokens: number;
  created_by: string;
  created_at: string;
  creator?: {
    email: string;
  };
}

interface VersionHistoryProps {
  promptId: string | null;
  currentVersion: {
    content: string;
    model: string;
    temperature: number;
    max_tokens: number;
  };
  onRevert: (version: PromptVersion) => void;
}

export function VersionHistory({ promptId, currentVersion, onRevert }: VersionHistoryProps) {
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [reverting, setReverting] = useState<string | null>(null);

  useEffect(() => {
    if (promptId) {
      loadVersions();
    }
  }, [promptId]);

  const loadVersions = async () => {
    if (!promptId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/prompts/${promptId}/versions`);
      const data = await response.json();

      if (response.ok) {
        setVersions(data.versions || []);
      } else {
        toast.error(data.error || 'Failed to load version history');
      }
    } catch (error) {
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleRevert = async (version: PromptVersion) => {
    if (!promptId) return;

    try {
      setReverting(version.id);
      const response = await fetch(`/api/prompts/${promptId}/versions/${version.id}/revert`, {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(`Reverted to version ${version.version_number}`);
        onRevert(version);
        await loadVersions();
      } else {
        toast.error(data.error || 'Failed to revert to version');
      }
    } catch (error) {
      toast.error('Failed to revert to version');
    } finally {
      setReverting(null);
    }
  };

  const isCurrentVersion = (version: PromptVersion) => {
    return (
      version.content === currentVersion.content &&
      version.model === currentVersion.model &&
      version.temperature === currentVersion.temperature &&
      version.max_tokens === currentVersion.max_tokens
    );
  };

  if (!promptId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
          <CardDescription>
            Save your prompt to see version history
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Version History
        </CardTitle>
        <CardDescription>
          {versions.length} {versions.length === 1 ? 'version' : 'versions'} saved
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Loading versions...
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            No versions yet. Changes will be tracked automatically.
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {versions.map((version) => {
                const isCurrent = isCurrentVersion(version);
                return (
                  <div
                    key={version.id}
                    className={`border rounded-lg p-4 ${
                      isCurrent ? 'bg-blue-50 border-blue-200' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={isCurrent ? 'default' : 'secondary'}>
                          v{version.version_number}
                        </Badge>
                        {isCurrent && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Current
                          </Badge>
                        )}
                      </div>
                      {!isCurrent && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRevert(version)}
                          disabled={reverting !== null}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          {reverting === version.id ? 'Reverting...' : 'Revert'}
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(version.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      {version.creator && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{version.creator.email}</span>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Model: {version.model} | Temp: {version.temperature} | Max Tokens:{' '}
                        {version.max_tokens}
                      </div>
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono max-h-20 overflow-hidden">
                        {version.content.substring(0, 150)}
                        {version.content.length > 150 && '...'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
