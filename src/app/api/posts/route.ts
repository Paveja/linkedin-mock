import { handleRequest, readJson } from '@/lib/http';
import { pageSchema } from '@/lib/post-validation';
import { createPost, listPosts } from '@/lib/posts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// This is an intentionally public shared feed: no account or ownership model.
export function GET(request: Request) {
  return handleRequest(() => {
    const page = pageSchema.parse(new URL(request.url).searchParams.get('page') ?? 1);
    return Response.json(listPosts(page));
  });
}

export function POST(request: Request) {
  return handleRequest(async () => {
    const post = createPost(await readJson(request));
    return Response.json(post, { status: 201 });
  });
}
