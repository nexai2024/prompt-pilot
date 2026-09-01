'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ScrollText } from 'lucide-react';

interface ReleaseNote {
  id: string;
  promptId: string;
  promptName: string;
  versionNumber: number;
  lane: string;
  changelog: string;
  createdAt: string;
}

export default function ReleasesPage() {
  const [releases, setReleases] = useState<ReleaseNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch('/api/releases', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setReleases(Array.isArray(data.releases) ? data.releases : []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Ship"
        title="Release notes"
        description="Changelogs from production publishes, deploys, and rollbacks."
      />
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : releases.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No release notes yet. Publish a prompt to production with a changelog to start the
            timeline.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {releases.map((release) => (
            <Card key={release.id}>
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="font-medium">{release.promptName}</p>
                    <Badge variant="secondary">v{release.versionNumber}</Badge>
                    <Badge variant="outline">{release.lane}</Badge>
                  </div>
                  <p className="text-sm">{release.changelog}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {release.createdAt
                      ? new Date(release.createdAt).toLocaleString()
                      : 'Unknown time'}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/prompt-studio?promptId=${release.promptId}`}>
                    <ScrollText className="mr-2 h-4 w-4" />
                    Open prompt
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
