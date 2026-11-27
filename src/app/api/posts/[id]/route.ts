import { handleRequest, HttpError, readJson } from '@/lib/http';
import { postIdSchema } from '@/lib/post-validation';
import { deletePost, updatePost } from '@/lib/posts';

type Context = { params: Promise<{ id: string }> };
export const runtime = 'nodejs';

export function PATCH(request: Request, context: Context) {
  return handleRequest(async () => {
    const id = postIdSchema.parse((await context.params).id);
    const post = updatePost(id, await readJson(request));
    if (!post) throw new HttpError(404, 'This post no longer exists. Refresh the feed.');
    return Response.json(post);
  });
}

export function DELETE(_request: Request, context: Context) {
  return handleRequest(async () => {
    const id = postIdSchema.parse((await context.params).id);
    const post = deletePost(id);
    if (!post) throw new HttpError(404, 'This post no longer exists. Refresh the feed.');
    return new Response(null, { status: 204 });
  });
}
