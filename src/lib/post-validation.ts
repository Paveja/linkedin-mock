import { z } from 'zod';

export const MAX_POST_LENGTH = 3000;
export const PAGE_SIZE = 6;
export const MAX_BODY_BYTES = 16000;

export const postInputSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(1, 'Write something before posting.')
      .max(
        MAX_POST_LENGTH,
        `Keep your post to ${MAX_POST_LENGTH.toLocaleString('en-US')} characters.`
      )
      .refine((content) => !content.includes('\0'), 'Remove unsupported null characters.'),
  })
  .strict();

export const postIdSchema = z.uuid();
export const pageSchema = z.coerce.number().int().min(1).max(100000);

export type Post = {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number | null;
};

export type PostPage = { items: Post[]; total: number; page: number; pages: number };
