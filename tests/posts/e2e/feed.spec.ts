import { test, expect, type Page, type APIRequestContext } from 'playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const baseURL = process.env.BASE_URL;
test.use({ baseURL, browserName: 'chromium', viewport: { width: 1280, height: 720 } });

// One page per file gives the entire-suite run one continuous video.
const VIDEO = process.env.QA_VIDEO === '1';
const DIR = '/tmp/revolte/qa-final/spec-videos';
let page: Page;
let failed = false;
let ownedIds: Set<string>;

type Post = { id: string; content: string; createdAt: number; updatedAt: number | null };
type PostPage = { items: Post[]; total: number; page: number; pages: number };

const uniqueText = (label: string) => `QA ${label} ${randomUUID()}`;
const card = (content: string) => page.getByRole('article').filter({
  has: page.getByText(content, { exact: true }),
});
const composer = () => page.getByRole('dialog', { name: 'Create a post', exact: true });
const textbox = () => page.getByRole('textbox', { name: 'Post text (required)', exact: true });

async function list(request: APIRequestContext, pageNumber = 1): Promise<PostPage> {
  const response = await request.get(`/api/posts?page=${pageNumber}`);
  expect(response.status()).toBe(200);
  return response.json();
}

async function seedPost(request: APIRequestContext, content: string): Promise<Post> {
  const response = await request.post('/api/posts', { data: { content } });
  expect(response.status()).toBe(201);
  const post: Post = await response.json();
  ownedIds.add(post.id);
  expect(post).toMatchObject({ id: expect.any(String), content, updatedAt: null });
  return post;
}

async function createThroughBrowser(content: string): Promise<Post> {
  // PostFeed -> Button -> native button; desktop name includes the prompt prefix.
  await page.getByRole('button', { name: /Create post$/ }).click();
  await expect(composer()).toBeVisible();
  await textbox().fill(content);
  const saved = page.waitForResponse(response =>
    new URL(response.url()).pathname === '/api/posts' && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Post', exact: true }).click();
  const response = await saved;
  expect(response.status()).toBe(201);
  const post: Post = await response.json();
  ownedIds.add(post.id);
  await expect(composer()).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('Your post is live.');
  await expect(card(content.trim())).toBeVisible();
  return post;
}

async function deleteThroughBrowser(content: string, id: string) {
  await card(content).getByRole('button', { name: `Delete post: ${content.slice(0, 48)}`, exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Delete this post?', exact: true });
  await expect(dialog).toBeVisible();
  const deleted = page.waitForResponse(response =>
    new URL(response.url()).pathname === `/api/posts/${id}` && response.request().method() === 'DELETE');
  await dialog.getByRole('button', { name: 'Delete post', exact: true }).click();
  expect((await deleted).status()).toBe(204);
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('Post deleted.');
  await expect(card(content)).toHaveCount(0);
}

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 1280, height: 720 },
    ...(VIDEO ? { recordVideo: { dir: `${DIR}/raw`, size: { width: 1280, height: 720 } } } : {}),
  });
  page = await context.newPage();
});

test.beforeEach(async () => {
  ownedIds = new Set();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your feed', exact: true })).toBeVisible();
});

test.afterEach(async ({ request }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) failed = true;
  if (VIDEO) await page.waitForTimeout(1500); // Evidence-only hold; never used for synchronization.
  for (const id of ownedIds) {
    const response = await request.delete(`/api/posts/${id}`);
    expect([204, 404], `cleanup of test-owned post ${id}`).toContain(response.status());
  }
});

test.afterAll(async ({}, testInfo) => {
  if (!page) return;
  const video = page.video();
  await page.context().close();
  if (!video) return;
  const stem = path.relative(testInfo.project.testDir, testInfo.file)
    .replace(/\.(spec|test)\.[jt]sx?$/, '').replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^[^A-Za-z0-9]+/, '').slice(0, 100);
  let name = stem;
  for (let n = 2; fs.existsSync(`${DIR}/${name}.webm`) || fs.existsSync(`${DIR}/${name}-FAILED.webm`); n++) {
    name = `${stem}-part${n}`;
  }
  await video.saveAs(`${DIR}/${name}${failed ? '-FAILED' : ''}.webm`);
  await video.delete();
});

test('FEED-01 creates a post that persists after reload', async ({ request }) => {
  const content = uniqueText('create');
  const post = await createThroughBrowser(content);
  await page.reload();
  await expect(card(content)).toBeVisible();
  expect((await list(request)).items).toContainEqual(post);
});

test('FEED-02 trims surrounding whitespace before persisting', async ({ request }) => {
  const content = uniqueText('trim');
  const post = await createThroughBrowser(`  ${content}  `);
  expect(post.content).toBe(content);
  expect((await list(request)).items.find(item => item.id === post.id)?.content).toBe(content);
});

test('FEED-03 rejects whitespace-only content without creating a record', async ({ request }) => {
  const before = await list(request);
  await page.getByRole('button', { name: /Create post$/ }).click();
  await textbox().fill('   ');
  await textbox().blur();
  await expect(composer().getByRole('alert')).toHaveText('Write something before posting.');
  await expect(composer().getByRole('button', { name: 'Post', exact: true })).toBeDisabled();
  await composer().getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(composer()).toHaveCount(0);
  expect((await list(request)).total).toBe(before.total);
});

test('FEED-04 accepts exactly 3000 characters', async ({ request }) => {
  const prefix = uniqueText('max');
  const content = prefix + 'x'.repeat(3000 - prefix.length);
  const post = await createThroughBrowser(content);
  expect(post.content).toHaveLength(3000);
  await page.reload();
  await expect(card(content)).toBeVisible();
  expect((await list(request)).items.find(item => item.id === post.id)?.content).toBe(content);
});

test('FEED-05 edits a post and persists the Edited state', async ({ request }) => {
  const original = uniqueText('original');
  const changed = uniqueText('edited');
  const post = await seedPost(request, original);
  await page.reload();
  await card(original).getByRole('button', { name: `Edit post: ${original.slice(0, 48)}`, exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Edit post', exact: true })).toBeVisible();
  await expect(textbox()).toHaveValue(original);
  await textbox().fill(changed);
  const saved = page.waitForResponse(response =>
    new URL(response.url()).pathname === `/api/posts/${post.id}` && response.request().method() === 'PATCH');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  const response = await saved;
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ id: post.id, content: changed, updatedAt: expect.any(Number) });
  await expect(page.getByRole('status')).toContainText('Changes saved.');
  await expect(card(changed).getByText('Edited', { exact: true })).toBeVisible();
  await page.reload();
  await expect(card(original)).toHaveCount(0);
  await expect(card(changed).getByText('Edited', { exact: true })).toBeVisible();
  expect((await list(request)).items.find(item => item.id === post.id)?.content).toBe(changed);
});

test('FEED-06 cancelling deletion preserves the post', async ({ request }) => {
  const content = uniqueText('cancel-delete');
  const post = await seedPost(request, content);
  await page.reload();
  await card(content).getByRole('button', { name: `Delete post: ${content.slice(0, 48)}`, exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Delete this post?', exact: true });
  await expect(dialog.getByText(content, { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await expect(card(content)).toBeVisible();
  expect((await list(request)).items).toContainEqual(post);
});

test('FEED-07 confirms permanent deletion', async ({ request }) => {
  const content = uniqueText('delete');
  const post = await seedPost(request, content);
  await page.reload();
  await deleteThroughBrowser(content, post.id);
  await page.reload();
  await expect(card(content)).toHaveCount(0);
  expect((await list(request)).items.map(item => item.id)).not.toContain(post.id);
});

test('FEED-08 paginates seven posts in newest-first order', async ({ request }) => {
  // Isolation precondition prevents this boundary test from relying on developer records.
  expect((await list(request)).total, 'use an isolated empty database for pagination boundaries').toBe(0);
  for (let n = 0; n < 7; n++) await seedPost(request, uniqueText(`pagination-${n}`));
  const first = await list(request);
  const second = await list(request, 2);
  expect(first).toMatchObject({ total: 7, page: 1, pages: 2 });
  expect(first.items).toHaveLength(6);
  expect(second.items).toHaveLength(1);
  const all = [...first.items, ...second.items];
  expect(all.map(item => item.id)).toEqual([...all].sort((a, b) =>
    b.createdAt - a.createdAt || b.id.localeCompare(a.id)).map(item => item.id));
  await page.reload();
  const nav = page.getByRole('navigation', { name: 'Pagination' });
  await expect(nav.getByText('Page 1 of 2', { exact: true })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(6);
  for (const post of first.items) await expect(card(post.content)).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Previous', exact: true })).toHaveCount(0);
  await nav.getByRole('link', { name: 'Next', exact: true }).click();
  await expect(page).toHaveURL(`${baseURL}/?page=2`);
  await expect(nav.getByText('Page 2 of 2', { exact: true })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(card(second.items[0].content)).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Next', exact: true })).toHaveCount(0);
  await nav.getByRole('link', { name: 'Previous', exact: true }).click();
  await expect(nav.getByText('Page 1 of 2', { exact: true })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(6);
});

test('FEED-09 deleting the only post on page two returns to page one', async ({ request }) => {
  expect((await list(request)).total, 'use an isolated empty database for pagination boundaries').toBe(0);
  for (let n = 0; n < 7; n++) await seedPost(request, uniqueText(`last-page-${n}`));
  const second = await list(request, 2);
  expect(second.items).toHaveLength(1);
  await page.goto('/?page=2');
  await expect(page.getByText('Page 2 of 2', { exact: true })).toBeVisible();
  const post = second.items[0];
  await deleteThroughBrowser(post.content, post.id);
  await expect(page).toHaveURL(`${baseURL}/`);
  await expect(page.getByRole('article')).toHaveCount(6);
  await expect(page.getByRole('navigation', { name: 'Pagination' })).toHaveCount(0);
  const remaining = await list(request);
  expect(remaining).toMatchObject({ total: 6, page: 1, pages: 1 });
  expect(remaining.items.map(item => item.id)).not.toContain(post.id);
});
