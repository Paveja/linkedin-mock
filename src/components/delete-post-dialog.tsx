'use client';

import { useId } from 'react';
import { Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { Post } from '@/lib/post-validation';
import { Button } from './button';
import { Dialog } from './dialog';

export function DeletePostDialog({
  post,
  pending,
  error,
  onDismiss,
  onDelete,
}: {
  post: Post;
  pending: boolean;
  error: string;
  onDismiss: () => void;
  onDelete: (id: string) => void;
}) {
  const titleId = useId();
  return (
    <Dialog
      aria-labelledby={titleId}
      title="Delete this post?"
      pending={pending}
      onDismiss={onDismiss}
    >
      <div className="space-y-6 p-6">
        <p className="text-muted-foreground text-pretty">
          This post will be permanently removed from the shared feed. This cannot be undone.
        </p>
        <blockquote
          className={clsx(
            'rounded-control border-border bg-muted line-clamp-3 border-l-4 p-4 text-base',
            'wrap-anywhere whitespace-pre-wrap'
          )}
        >
          {post.content}
        </blockquote>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button autoFocus disabled={pending} onClick={onDismiss}>
            Cancel
          </Button>
          <Button variant="danger" disabled={pending} onClick={() => onDelete(post.id)}>
            <Trash2 size={16} aria-hidden="true" />
            {pending ? 'Deleting…' : 'Delete post'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
