import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const posts = sqliteTable(
  'posts',
  {
    id: text('id').primaryKey(),
    content: text('content').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at'),
  },
  (table) => [
    index('posts_created_index').on(table.createdAt, table.id),
    check('post_content_length', sql`length(trim(${table.content})) BETWEEN 1 AND 3000`),
  ]
);
