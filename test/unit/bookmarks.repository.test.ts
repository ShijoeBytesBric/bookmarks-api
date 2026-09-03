import { describe, expect, it } from 'vitest';

import { createInMemoryBookmarkRepository } from '../../src/modules/bookmarks/repository.js';
import type { CreateBookmark } from '../../src/modules/bookmarks/schema.js';

const validInput: CreateBookmark = {
  title: 'Fastify docs',
  url: 'https://fastify.dev',
  tags: ['node', 'docs'],
};

describe('InMemoryBookmarkRepository', () => {
  it('creates a bookmark with generated id and timestamps', async () => {
    const repo = createInMemoryBookmarkRepository();
    const bookmark = await repo.create(validInput);

    expect(bookmark.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(new Date(bookmark.createdAt).toISOString()).toBe(bookmark.createdAt);
    expect(bookmark.updatedAt).toBe(bookmark.createdAt);
    expect(bookmark.title).toBe('Fastify docs');
  });

  it('defaults tags to an empty array when omitted', async () => {
    const repo = createInMemoryBookmarkRepository();
    const { title, url } = validInput;
    const bookmark = await repo.create({ title, url });

    expect(bookmark.tags).toEqual([]);
  });

  it('returns undefined for an unknown id', async () => {
    const repo = createInMemoryBookmarkRepository();
    await expect(repo.getById('00000000-0000-4000-8000-000000000000')).resolves.toBeUndefined();
  });

  it('lists bookmarks sorted by creation time', async () => {
    const repo = createInMemoryBookmarkRepository();
    const first = await repo.create(validInput);
    const second = await repo.create({ ...validInput, title: 'Vitest docs' });

    const list = await repo.list();
    expect(list.map((b) => b.id)).toEqual([first.id, second.id]);
  });

  it('updates only the provided fields and bumps updatedAt', async () => {
    const repo = createInMemoryBookmarkRepository();
    const created = await repo.create(validInput);

    const updated = await repo.update(created.id, { title: 'Fastify v5 docs' });
    expect(updated?.title).toBe('Fastify v5 docs');
    expect(updated?.url).toBe(created.url);
    expect(updated?.id).toBe(created.id);
    expect(updated?.createdAt).toBe(created.createdAt);
    expect(updated?.updatedAt).not.toBe(created.updatedAt);
  });

  it('returns undefined when updating an unknown id', async () => {
    const repo = createInMemoryBookmarkRepository();
    await expect(
      repo.update('00000000-0000-4000-8000-000000000000', { title: 'x' }),
    ).resolves.toBeUndefined();
  });

  it('deletes a bookmark once, then reports it gone', async () => {
    const repo = createInMemoryBookmarkRepository();
    const created = await repo.create(validInput);

    await expect(repo.delete(created.id)).resolves.toBe(true);
    await expect(repo.delete(created.id)).resolves.toBe(false);
    await expect(repo.getById(created.id)).resolves.toBeUndefined();
  });
});
