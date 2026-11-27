import { PostFeed } from '@/components/post-feed';
import { pageSchema } from '@/lib/post-validation';
import { listPosts } from '@/lib/posts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { page } = await searchParams;
  const parsed = pageSchema.safeParse(page ?? 1);
  const result = listPosts(parsed.success ? parsed.data : 1);

  return (
    <main
      id="main-content"
      className="motion-safe:animate-feed-enter mx-auto w-full max-w-2xl px-4 py-8 sm:py-12"
    >
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">
          Your feed
        </h1>
        <p className="text-muted-foreground mt-2 max-w-lg text-base text-pretty">
          A shared space. Everyone with access can create, edit, and delete posts.
        </p>
      </header>
      <PostFeed result={result} />
    </main>
  );
}
