import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { eq } from 'drizzle-orm';
import { openDatabase } from '../db';
import { posts } from '../db/schema';
import { MAX_BODY_BYTES, MAX_POST_LENGTH, PAGE_SIZE } from './post-validation';
import { createPost, listPosts, updatePost, deletePost } from './posts';
import { getDatabase } from '../db';

process.env.DATABASE_URL = ':memory:';

type Collection = typeof import('../app/api/posts/route');
type Item = typeof import('../app/api/posts/[id]/route');
let collection: Collection;
let item: Item;

before(async () => {
  collection = await import('../app/api/posts/route');
  item = await import('../app/api/posts/[id]/route');
});

after(() => {
  const globalDatabase = globalThis as unknown as {
    postDatabase?: ReturnType<typeof openDatabase>;
  };
  globalDatabase.postDatabase?.sqlite.close();
  delete globalDatabase.postDatabase;
});

const request = (method: string, payload?: unknown) =>
  new Request('http://feed.test/api/posts', {
    method,
    headers: { 'content-type': 'application/json' },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
const context = (id: string) => ({ params: Promise.resolve({ id }) });

test('bootstrap, create, edit, delete and persistence use the real database', () => {
  const { database, sqlite } = openDatabase(':memory:');
  try {
    const post = createPost({ content: '  A useful update.  ' }, database);
    assert.ok(post);
    assert.equal(post.content, 'A useful update.');
    assert.equal(
      database.select().from(posts).where(eq(posts.id, post.id)).get()?.content,
      post.content
    );
    assert.equal(post.updatedAt, null);
    const edited = updatePost(post.id, { content: 'An edited update.' }, database);
    assert.equal(edited?.content, 'An edited update.');
    assert.ok(edited?.updatedAt);
    assert.equal(listPosts(1, database).items[0]?.content, 'An edited update.');
    assert.ok(deletePost(post.id, database));
    assert.equal(listPosts(1, database).total, 0);
    assert.equal(deletePost(post.id, database), undefined);
  } finally {
    sqlite.close();
  }
});

test('posts survive closing and reopening a file database', () => {
  const directory = mkdtempSync(path.join(process.cwd(), '.post-test-'));
  const filename = path.join(directory, 'persistence.db');
  try {
    const original = openDatabase(filename);
    const post = createPost({ content: 'This post survives a restart.' }, original.database);
    original.sqlite.close();
    const reopened = openDatabase(filename);
    try {
      assert.equal(listPosts(1, reopened.database).items[0]?.id, post?.id);
    } finally {
      reopened.sqlite.close();
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('database constraints reject blank and oversized content', () => {
  const { database, sqlite } = openDatabase(':memory:');
  try {
    for (const content of [' ', 'x'.repeat(MAX_POST_LENGTH + 1)]) {
      assert.throws(() =>
        database.insert(posts).values({ id: randomUUID(), content, createdAt: 1 }).run()
      );
    }
  } finally {
    sqlite.close();
  }
});

test('pagination is bounded, deterministic and clamps missing pages', () => {
  const { database, sqlite } = openDatabase(':memory:');
  try {
    const records = Array.from({ length: PAGE_SIZE + 2 }, (_, index) => ({
      id: randomUUID(),
      content: `Update ${index}`,
      createdAt: 1000,
    }));
    database.insert(posts).values(records).run();
    const first = listPosts(1, database);
    const second = listPosts(2, database);
    assert.equal(first.items.length, PAGE_SIZE);
    assert.equal(first.total, PAGE_SIZE + 2);
    assert.equal(second.items.length, 2);
    assert.equal(
      new Set([...first.items, ...second.items].map((post) => post.id)).size,
      PAGE_SIZE + 2
    );
    assert.deepEqual(
      first.items.map((post) => post.id),
      records
        .map((post) => post.id)
        .sort()
        .reverse()
        .slice(0, PAGE_SIZE)
    );
    assert.equal(listPosts(999, database).page, 2);
    assert.throws(() => listPosts(0, database));
  } finally {
    sqlite.close();
  }
});

test('public HTTP handlers create, persist, list, edit and delete without sign-in', async () => {
  const created = await collection.POST(request('POST', { content: 'An API update.' }));
  assert.equal(created.status, 201);
  const post = await created.json();
  assert.equal(
    getDatabase().select().from(posts).where(eq(posts.id, post.id)).get()?.content,
    'An API update.'
  );
  const feed = await collection.GET(request('GET'));
  assert.equal(feed.status, 200);
  assert.ok(
    (await feed.json()).items.some((candidate: { id: string }) => candidate.id === post.id)
  );
  const edited = await item.PATCH(
    request('PATCH', { content: 'Edited through the API.' }),
    context(post.id)
  );
  assert.equal(edited.status, 200);
  assert.ok((await edited.json()).updatedAt);
  assert.equal(
    getDatabase().select().from(posts).where(eq(posts.id, post.id)).get()?.content,
    'Edited through the API.'
  );
  assert.equal((await item.DELETE(request('DELETE'), context(post.id))).status, 204);
  assert.equal(getDatabase().select().from(posts).where(eq(posts.id, post.id)).get(), undefined);
});

test('all mutation handlers reject malformed, blank, oversized and unexpected input', async () => {
  const post = createPost({ content: 'Keep this content.' });
  assert.ok(post);
  const badInputs = [
    { content: '' },
    { content: ' \n ' },
    { content: 'x'.repeat(MAX_POST_LENGTH + 1) },
    { content: 12 },
    { content: '\0' },
    { content: 'ok', id: 'injected' },
    {},
  ];
  for (const payload of badInputs) {
    assert.equal((await collection.POST(request('POST', payload))).status, 400);
    assert.equal((await item.PATCH(request('PATCH', payload), context(post.id))).status, 400);
  }
  for (const method of ['POST', 'PATCH']) {
    const malformed = new Request('http://feed.test/api/posts', {
      method,
      headers: { 'content-type': 'application/json' },
      body: '{broken',
    });
    const oversized = new Request('http://feed.test/api/posts', {
      method,
      headers: { 'content-type': 'application/json' },
      body: 'x'.repeat(MAX_BODY_BYTES + 1),
    });
    const wrongType = new Request('http://feed.test/api/posts', { method, body: 'plain text' });
    const send = (incoming: Request) =>
      method === 'POST' ? collection.POST(incoming) : item.PATCH(incoming, context(post.id));
    assert.equal((await send(malformed)).status, 400);
    assert.equal((await send(oversized)).status, 413);
    assert.equal((await send(wrongType)).status, 415);
    assert.equal((await send(request(method))).status, 400);
  }
  assert.equal(
    getDatabase().select().from(posts).where(eq(posts.id, post.id)).get()?.content,
    'Keep this content.'
  );
  deletePost(post.id);
});

test('missing posts and invalid identifiers return controlled errors', async () => {
  const missing = randomUUID();
  for (const [id, status] of [
    [missing, 404],
    ['not-an-id', 400],
  ] as const) {
    assert.equal(
      (await item.PATCH(request('PATCH', { content: 'Update' }), context(id))).status,
      status
    );
    assert.equal((await item.DELETE(request('DELETE'), context(id))).status, status);
  }
  for (const page of ['0', '-1', 'abc', '1.5', '100001']) {
    const response = await collection.GET(new Request(`http://feed.test/api/posts?page=${page}`));
    assert.equal(response.status, 400);
  }
});
