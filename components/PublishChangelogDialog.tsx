'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CHANGELOG_MAX_LENGTH, CHANGELOG_MIN_LENGTH } from '@/lib/changelog';

interface PublishChangelogDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (changelog: string) => void;
}

export function PublishChangelogDialog({
  open,
  title = 'Publish to production',
  description = 'Live traffic will use this snapshot. Add a short note so the team knows what changed.',
  confirmLabel = 'Publish',
  pending = false,
  onOpenChange,
  onConfirm,
}: PublishChangelogDialogProps) {
  const [changelog, setChangelog] = useState('');
  const tooShort = changelog.trim().length < CHANGELOG_MIN_LENGTH;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setChangelog('');
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="publish-changelog">Changelog</Label>
          <Textarea
            id="publish-changelog"
            value={changelog}
            onChange={(event) => setChangelog(event.target.value)}
            placeholder="e.g. Tightened the refund policy wording and added order_id as a required variable."
            maxLength={CHANGELOG_MAX_LENGTH}
            className="min-h-[120px]"
          />
          <p className="text-xs text-muted-foreground">
            {changelog.trim().length}/{CHANGELOG_MAX_LENGTH} · at least {CHANGELOG_MIN_LENGTH}{' '}
            characters
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            disabled={tooShort || pending}
            onClick={() => onConfirm(changelog.trim())}
          >
            {pending ? 'Publishing...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
