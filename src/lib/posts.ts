import { randomUUID } from 'node:crypto';
import { count, desc, eq } from 'drizzle-orm';
import { getDatabase, type PostDatabase } from '../db';
import { posts } from '../db/schema';
import { PAGE_SIZE, pageSchema, postIdSchema, postInputSchema } from './post-validation';

export function listPosts(page = 1, database: PostDatabase = getDatabase()) {
  const requestedPage = pageSchema.parse(page);
  return database.transaction((transaction) => {
    const total = transaction.select({ value: count() }).from(posts).get()?.value ?? 0;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const currentPage = Math.min(requestedPage, pages);
    const items = transaction
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt), desc(posts.id))
      .limit(PAGE_SIZE)
      .offset((currentPage - 1) * PAGE_SIZE)
      .all();
    return { items, total, page: currentPage, pages };
  });
}

export function createPost(input: unknown, database: PostDatabase = getDatabase()) {
  const { content } = postInputSchema.parse(input);
  return database
    .insert(posts)
    .values({
      id: randomUUID(),
      content,
      createdAt: Date.now(),
      updatedAt: null,
    })
    .returning()
    .get();
}

export function updatePost(id: string, input: unknown, database: PostDatabase = getDatabase()) {
  postIdSchema.parse(id);
  const { content } = postInputSchema.parse(input);
  return database
    .update(posts)
    .set({ content, updatedAt: Date.now() })
    .where(eq(posts.id, id))
    .returning()
    .get();
}

export function deletePost(id: string, database: PostDatabase = getDatabase()) {
  postIdSchema.parse(id);
  return database.delete(posts).where(eq(posts.id, id)).returning({ id: posts.id }).get();
}
