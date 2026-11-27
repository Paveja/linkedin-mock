'use client';

import { useId, useState, type FormEvent } from 'react';
import { Globe2 } from 'lucide-react';
import { clsx } from 'clsx';
import { MAX_POST_LENGTH, postInputSchema, type Post } from '@/lib/post-validation';
import { Avatar } from './avatar';
import { Button } from './button';
import { Dialog } from './dialog';

type Props = {
  post?: Post;
  pending: boolean;
  error: string;
  onDismiss: () => void;
  onSave: (content: string, id?: string) => void;
};

export function PostComposer({ post, pending, error, onDismiss, onSave }: Props) {
  const [content, setContent] = useState(post?.content ?? '');
  const [validationError, setValidationError] = useState('');
  const fieldId = useId();
  const message = validationError || error;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = postInputSchema.safeParse({ content });
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message ?? 'Check your post.');
      return;
    }
    setValidationError('');
    onSave(result.data.content, post?.id);
  }

  return (
    <Dialog
      aria-labelledby={`${fieldId}-title`}
      title={post ? 'Edit post' : 'Create a post'}
      pending={pending}
      onDismiss={onDismiss}
    >
      <form onSubmit={submit} className="space-y-6 p-6">
        <div className="flex items-center gap-3">
          <Avatar />
          <div>
            <p className="font-semibold">You</p>
            <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
              <Globe2 size={12} aria-hidden="true" />
              Visible to everyone with access
            </p>
          </div>
        </div>
        <div>
          <label htmlFor={fieldId} className="mb-2 block text-sm font-medium">
            Post text <span className="text-muted-foreground font-normal">(required)</span>
          </label>
          <textarea
            id={fieldId}
            autoFocus
            required
            rows={7}
            maxLength={MAX_POST_LENGTH}
            value={content}
            disabled={pending}
            onChange={(event) => {
              setContent(event.target.value);
              setValidationError('');
            }}
            onBlur={() => {
              if (content.length > 0 && !content.trim())
                setValidationError('Write something before posting.');
            }}
            aria-invalid={Boolean(message)}
            aria-describedby={`${fieldId}-count${message ? ` ${fieldId}-error` : ''}`}
            placeholder="What would you like to share?"
            className={clsx(
              'rounded-control border-border bg-card w-full resize-y border p-4 text-base leading-7',
              'placeholder:text-muted-foreground focus-visible:outline-ring',
              'focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60'
            )}
          />
          <p
            id={`${fieldId}-count`}
            className="text-muted-foreground mt-2 text-right text-xs tabular-nums"
          >
            {content.length.toLocaleString('en-US')} / {MAX_POST_LENGTH.toLocaleString('en-US')}{' '}
            characters
          </p>
          {message && (
            <p id={`${fieldId}-error`} role="alert" className="text-destructive mt-2 text-sm">
              {message}
            </p>
          )}
        </div>
        <footer className="border-border flex justify-end gap-2 border-t pt-4">
          <Button onClick={onDismiss} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={pending || !content.trim()}>
            {pending ? 'Saving…' : post ? 'Save changes' : 'Post'}
          </Button>
        </footer>
      </form>
    </Dialog>
  );
}
