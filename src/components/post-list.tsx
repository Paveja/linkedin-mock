import Link from 'next/link';
import { clsx } from 'clsx';
import { ArrowDownWideNarrow, ArrowLeft, ArrowRight, PenLine } from 'lucide-react';
import { PAGE_SIZE, type Post, type PostPage } from '@/lib/post-validation';
import { PostCard } from './post-card';

type Props = {
  result: PostPage;
  pending: boolean;
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
};

export function PostList({ result, pending, onEdit, onDelete }: Props) {
  const linkStyle = clsx(
    'inline-flex min-h-12 items-center gap-2 rounded-full px-4 text-sm font-medium',
    'transition-colors hover:bg-muted focus-visible:outline-2',
    'focus-visible:outline-offset-2 focus-visible:outline-ring'
  );
  return (
    <>
      <div className="flex items-center justify-between gap-4 px-1">
        <h2 className="font-heading text-sm font-semibold">Latest posts</h2>
        <span className="text-muted-foreground flex items-center gap-2 text-xs">
          <ArrowDownWideNarrow size={14} aria-hidden="true" />
          Newest first
        </span>
      </div>
      <div aria-busy={pending} className="space-y-4">
        {result.items.length === 0 ? (
          <section
            className={clsx(
              'rounded-container border-border bg-card border border-dashed',
              'px-6 py-16 text-center'
            )}
          >
            <PenLine size={32} aria-hidden="true" className="text-primary mx-auto mb-4" />
            <h3 className="font-heading text-xl font-semibold">Your first post starts here</h3>
            <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-base text-pretty">
              Share an idea or an update using Create post above.
            </p>
          </section>
        ) : (
          result.items.map((post) => (
            <PostCard key={post.id} post={post} onEdit={onEdit} onDelete={onDelete} />
          ))
        )}
      </div>
      {result.total > PAGE_SIZE && (
        <nav
          aria-label="Pagination"
          className={clsx(
            'flex flex-wrap items-center justify-between gap-2 border-t',
            'border-border text-muted-foreground pt-4'
          )}
        >
          {result.page > 1 ? (
            <Link className={linkStyle} href={`/?page=${result.page - 1}`}>
              <ArrowLeft size={16} aria-hidden="true" />
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-xs tabular-nums" aria-current="page">
            Page {result.page} of {result.pages}
          </span>
          {result.page < result.pages ? (
            <Link className={linkStyle} href={`/?page=${result.page + 1}`}>
              Next
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
