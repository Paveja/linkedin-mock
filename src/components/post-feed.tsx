'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { CheckCircle2, Plus, X } from 'lucide-react';
import { type Post, type PostPage } from '@/lib/post-validation';
import { usePostMutations } from '@/lib/use-post-mutations';
import { Avatar } from './avatar';
import { Button } from './button';
import { PostList } from './post-list';
import { PostComposer } from './post-composer';
import { DeletePostDialog } from './delete-post-dialog';

type Selection = { kind: 'create' } | { kind: 'edit' | 'delete'; post: Post } | null;

export function PostFeed({ result }: { result: PostPage }) {
  const [selection, setSelection] = useState<Selection>(null);
  const [notice, setNotice] = useState('');
  const mutations = usePostMutations(result.page, result.items.length, (message) => {
    setNotice(message);
    setSelection(null);
  });

  function open(next: Selection) {
    mutations.clearError();
    setSelection(next);
  }

  return (
    <div className="space-y-6">
      <section
        aria-label="Share an update"
        className="rounded-container border-border bg-card border p-6 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <Avatar />
          <Button
            id="create-post"
            className="border-primary/30 text-primary min-h-12 flex-1 justify-between gap-2 text-left"
            onClick={() => open({ kind: 'create' })}
          >
            <span className="text-muted-foreground hidden font-normal sm:inline">
              What would you like to share?
            </span>
            <span className="inline-flex items-center gap-2">
              <Plus size={18} aria-hidden="true" />
              Create post
            </span>
          </Button>
        </div>
      </section>
      {notice && (
        <div
          role="status"
          className={clsx(
            'rounded-control border-success/30 flex items-center gap-3 border',
            'bg-card text-success py-2 pr-2 pl-4 text-sm'
          )}
        >
          <CheckCircle2 size={18} aria-hidden="true" />
          <span className="flex-1">{notice}</span>
          <Button
            variant="ghost"
            className="size-12 p-0"
            aria-label="Dismiss notification"
            onClick={() => setNotice('')}
          >
            <X size={16} aria-hidden="true" />
          </Button>
        </div>
      )}
      <PostList
        result={result}
        pending={mutations.pending}
        onEdit={(post) => open({ kind: 'edit', post })}
        onDelete={(post) => open({ kind: 'delete', post })}
      />
      {selection?.kind === 'create' && (
        <PostComposer
          key="new"
          pending={mutations.pending}
          error={mutations.error}
          onDismiss={() => setSelection(null)}
          onSave={mutations.save}
        />
      )}
      {selection?.kind === 'edit' && (
        <PostComposer
          key={selection.post.id}
          post={selection.post}
          pending={mutations.pending}
          error={mutations.error}
          onDismiss={() => setSelection(null)}
          onSave={mutations.save}
        />
      )}
      {selection?.kind === 'delete' && (
        <DeletePostDialog
          post={selection.post}
          pending={mutations.pending}
          error={mutations.error}
          onDismiss={() => setSelection(null)}
          onDelete={mutations.remove}
        />
      )}
    </div>
  );
}
