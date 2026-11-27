'use client';

import { Globe2, Pencil, Trash2 } from 'lucide-react';
import type { Post } from '@/lib/post-validation';
import { Avatar } from './avatar';
import { Button } from './button';

const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
});

export function PostCard({
  post,
  onEdit,
  onDelete,
}: {
  post: Post;
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
}) {
  return (
    <article
      aria-label={`Post from ${dateFormat.format(post.createdAt)} UTC`}
      className="rounded-container border-border bg-card border shadow-sm"
    >
      <header className="flex items-start gap-3 px-6 pt-6">
        <Avatar />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">You</p>
          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <time dateTime={new Date(post.createdAt).toISOString()}>
              {dateFormat.format(post.createdAt)} UTC
            </time>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Globe2 size={12} aria-hidden="true" />
              Shared
            </span>
            {post.updatedAt !== null && (
              <span
                title={`Last edited ${dateFormat.format(post.updatedAt)} UTC`}
                className="bg-muted rounded-full px-2 py-1 font-medium"
              >
                Edited
              </span>
            )}
          </div>
        </div>
      </header>
      <p className="px-6 py-6 text-base leading-7 text-pretty wrap-anywhere whitespace-pre-wrap">
        {post.content}
      </p>
      <footer className="border-border flex items-center justify-end gap-1 border-t px-3 py-1">
        <Button
          variant="ghost"
          onClick={() => onEdit(post)}
          aria-label={`Edit post: ${post.content.slice(0, 48)}`}
        >
          <Pencil size={16} aria-hidden="true" />
          Edit
        </Button>
        <Button
          variant="ghost"
          className="hover:text-destructive"
          onClick={() => onDelete(post)}
          aria-label={`Delete post: ${post.content.slice(0, 48)}`}
        >
          <Trash2 size={16} aria-hidden="true" />
          Delete
        </Button>
      </footer>
    </article>
  );
}
