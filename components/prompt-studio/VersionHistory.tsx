'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  History,
  Clock,
  Check,
  GitCompare,
  Lock,
  Pencil,
  Camera,
  Rocket,
  Undo2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { VersionDiff } from '@/components/prompt-studio/VersionDiff';
import { PublishChangelogDialog } from '@/components/PublishChangelogDialog';

export interface PromptVersion {
  id: string;
  prompt_id: string;
  version_number: number;
  content: string;
  model: string;
  temperature: number;
  max_tokens: number;
  lane?: 'dev' | 'prod' | 'shelf' | 'snapshot';
  locked?: boolean;
  populated?: boolean;
  response_format?: string;
  created_by: string;
  created_at: string;
  creator?: {
    email: string;
  };
}

interface VersionLanesPayload {
  dev: PromptVersion | null;
  prod: PromptVersion | null;
  shelf: PromptVersion | null;
}

interface VersionHistoryProps {
  promptId: string | null;
  currentVersion: {
    content: string;
    model: string;
    temperature: number;
    max_tokens: number;
  };
  refreshKey?: number;
  onWorkingCopyChange: (version: PromptVersion) => void;
  onLanesChange?: (state: {
    editingProd: boolean;
    prodPublished: boolean;
    drifted: boolean;
  }) => void;
}

function laneLabel(lane: PromptVersion['lane']): string {
  if (lane === 'dev') return 'Dev';
  if (lane === 'prod') return 'Prod';
  if (lane === 'shelf') return 'Shelf';
  return 'Snapshot';
}

function VersionCard({
  version,
  title,
  description,
  highlight,
  actions,
  currentContent,
  compareId,
  onCompare,
}: {
  version: PromptVersion;
  title: string;
  description: string;
  highlight?: boolean;
  actions?: ReactNode;
  currentContent: string;
  compareId: string | null;
  onCompare: (id: string | null) => void;
}) {
  const populated =
    version.populated !== false && String(version.content || '').trim().length > 0;

  return (
    <div
      className={`border rounded-lg p-4 ${
        highlight ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/30' : 'bg-card'
      }`}
    >
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={highlight ? 'default' : 'secondary'}>{title}</Badge>
          {version.locked !== false && version.lane !== 'dev' && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Locked
            </Badge>
          )}
          {version.lane === 'dev' && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Pencil className="h-3 w-3" />
              Editable
            </Badge>
          )}
          {version.lane === 'prod' && !populated && (
            <Badge variant="outline">Empty until first deploy</Badge>
          )}
        </div>
        {actions}
      </div>
      <p className="text-xs text-muted-foreground mb-2">{description}</p>
      <div className="space-y-2 text-sm">
        {version.created_at && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
            </span>
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          {populated
            ? `Model: ${version.model} | Temp: ${version.temperature} | Max Tokens: ${version.max_tokens}`
            : 'No production content yet.'}
        </div>
        {populated && (
          <div className="mt-2 p-2 bg-muted rounded text-xs font-mono max-h-20 overflow-hidden">
            {version.content.substring(0, 150)}
            {version.content.length > 150 && '...'}
          </div>
        )}
        {compareId === version.id && populated && (
          <div className="mt-3">
            <VersionDiff
              leftLabel={title}
              rightLabel="Current editor"
              leftContent={version.content}
              rightContent={currentContent}
            />
          </div>
        )}
        {populated && version.lane !== 'dev' && (
          <Button
            size="sm"
            variant="ghost"
            className="mt-1 px-0"
            onClick={() => onCompare(compareId === version.id ? null : version.id)}
          >
            <GitCompare className="h-3 w-3 mr-1" />
            {compareId === version.id ? 'Hide diff' : 'Compare'}
          </Button>
        )}
      </div>
    </div>
  );
}

export function VersionHistory({
  promptId,
  currentVersion,
  refreshKey = 0,
  onWorkingCopyChange,
  onLanesChange,
}: VersionHistoryProps) {
  const [lanes, setLanes] = useState<VersionLanesPayload>({
    dev: null,
    prod: null,
    shelf: null,
  });
  const [snapshots, setSnapshots] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);

  useEffect(() => {
    if (promptId) {
      void loadVersions();
    }
  }, [promptId, refreshKey]);

  const loadVersions = async () => {
    if (!promptId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/prompts/${promptId}/versions`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (response.ok) {
        const nextLanes: VersionLanesPayload = {
          dev: data.lanes?.dev ?? null,
          prod: data.lanes?.prod ?? null,
          shelf: data.lanes?.shelf ?? null,
        };
        setLanes(nextLanes);
        setSnapshots(data.snapshots || []);
        onLanesChange?.({
          editingProd: Boolean(nextLanes.shelf),
          prodPublished: Boolean(data.prodPublished),
          drifted: Boolean(data.drifted),
        });
      } else {
        toast.error(data.error || 'Failed to load version history');
      }
    } catch {
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (
    key: string,
    path: string,
    successMessage: string,
    loadWorkingCopy = false,
    payload?: Record<string, unknown>
  ) => {
    if (!promptId) return;
    try {
      setBusy(key);
      const response = await fetch(path, {
        method: 'POST',
        credentials: 'include',
        headers: payload ? { 'Content-Type': 'application/json' } : undefined,
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || successMessage);
      toast.success(successMessage);
      if (loadWorkingCopy && data.versioning?.lanes?.dev) {
        onWorkingCopyChange(data.versioning.lanes.dev as PromptVersion);
      }
      await loadVersions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  const handleLoadIntoDev = async (version: PromptVersion) => {
    if (!promptId) return;
    try {
      setBusy(version.id);
      const response = await fetch(
        `/api/prompts/${promptId}/versions/${version.id}/revert`,
        { method: 'POST', credentials: 'include' }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load version');
      toast.success(`Loaded ${laneLabel(version.lane)} into the working copy`);
      onWorkingCopyChange({ ...version, lane: 'dev', locked: false });
      await loadVersions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load version');
    } finally {
      setBusy(null);
    }
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
            Save your prompt to create the Dev and Prod system versions
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const prodPublished =
    Boolean(lanes.prod) &&
    lanes.prod?.populated !== false &&
    String(lanes.prod?.content || '').trim().length > 0;

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </CardTitle>
            <CardDescription>
              Dev is the working copy. Prod is locked live traffic. Shelf parks Dev when you need
              to hotfix Prod. Snapshots are created by structure-change rules or by you.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={() =>
                runAction(
                  'snapshot',
                  `/api/prompts/${promptId}/versions`,
                  'Snapshot created from the working copy',
                  false,
                  currentVersion
                )
              }
            >
              <Camera className="h-3 w-3 mr-1" />
              {busy === 'snapshot' ? 'Saving...' : 'Create snapshot'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={() => setPublishOpen(true)}
            >
              <Rocket className="h-3 w-3 mr-1" />
              {busy === 'promote' ? 'Publishing...' : 'Publish to prod'}
            </Button>
            {prodPublished && !lanes.shelf && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy !== null}
                onClick={() => {
                  if (
                    !window.confirm(
                      'Park the current working copy on the shelf and load production into Dev for editing? After you publish, the shelf is restored automatically.'
                    )
                  ) {
                    return;
                  }
                  void runAction(
                    'edit-prod',
                    `/api/prompts/${promptId}/versions/edit-prod`,
                    'Production loaded into the working copy',
                    true
                  );
                }}
              >
                <Pencil className="h-3 w-3 mr-1" />
                {busy === 'edit-prod' ? 'Loading...' : 'Edit production'}
              </Button>
            )}
            {lanes.shelf && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy !== null}
                onClick={() =>
                  runAction(
                    'cancel',
                    `/api/prompts/${promptId}/versions/cancel-edit-prod`,
                    'Restored parked working copy',
                    true
                  )
                }
              >
                <Undo2 className="h-3 w-3 mr-1" />
                {busy === 'cancel' ? 'Restoring...' : 'Cancel prod edit'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Loading versions...
          </div>
        ) : (
          <ScrollArea className="h-[480px] pr-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">System versions</h3>
                <div className="space-y-3">
                  {lanes.dev && (
                    <VersionCard
                      version={lanes.dev}
                      title="Dev"
                      description="Working copy. The only version you can edit."
                      highlight
                      currentContent={currentVersion.content}
                      compareId={compareVersionId}
                      onCompare={setCompareVersionId}
                    />
                  )}
                  {lanes.prod && (
                    <VersionCard
                      version={lanes.prod}
                      title="Prod"
                      description="Locked live copy. Gateway traffic always uses this version."
                      currentContent={currentVersion.content}
                      compareId={compareVersionId}
                      onCompare={setCompareVersionId}
                    />
                  )}
                  {lanes.shelf && (
                    <VersionCard
                      version={lanes.shelf}
                      title="Shelf"
                      description="Parked working copy while production is being edited."
                      currentContent={currentVersion.content}
                      compareId={compareVersionId}
                      onCompare={setCompareVersionId}
                    />
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">
                  Snapshots ({snapshots.length})
                </h3>
                {snapshots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No snapshots yet. They appear when input/output structure changes, when you
                    create one manually, or when a previous production copy is archived on publish.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {snapshots.map((version) => (
                      <VersionCard
                        key={version.id}
                        version={version}
                        title={`v${version.version_number}`}
                        description="Locked snapshot. Load it into Dev to keep working from this copy."
                        currentContent={currentVersion.content}
                        compareId={compareVersionId}
                        onCompare={setCompareVersionId}
                        actions={
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy !== null}
                            onClick={() => handleLoadIntoDev(version)}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            {busy === version.id ? 'Loading...' : 'Load into Dev'}
                          </Button>
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
    <PublishChangelogDialog
      open={publishOpen}
      pending={busy === 'promote'}
      onOpenChange={setPublishOpen}
      onConfirm={(changelog) => {
        setPublishOpen(false);
        void runAction(
          'promote',
          `/api/prompts/${promptId}/versions/promote`,
          'Published working copy to production',
          true,
          { changelog }
        );
      }}
    />
    </>
  );
}
