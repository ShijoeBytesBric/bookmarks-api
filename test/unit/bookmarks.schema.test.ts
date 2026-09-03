import { describe, expect, it } from 'vitest';

import {
  bookmarkSchema,
  createBookmarkSchema,
  updateBookmarkSchema,
} from '../../src/modules/bookmarks/schema.js';

describe('createBookmarkSchema', () => {
  it('accepts a valid payload', () => {
    const input = { title: 'Fastify docs', url: 'https://fastify.dev', tags: ['node'] };
    expect(createBookmarkSchema.parse(input)).toEqual(input);
  });

  it('accepts a payload without tags', () => {
    expect(() =>
      createBookmarkSchema.parse({ title: 'x', url: 'https://fastify.dev' }),
    ).not.toThrow();
  });

  it('rejects an invalid url', () => {
    expect(() => createBookmarkSchema.parse({ title: 'x', url: 'not-a-url' })).toThrow();
  });

  it('rejects an empty title', () => {
    expect(() => createBookmarkSchema.parse({ title: '', url: 'https://fastify.dev' })).toThrow();
  });

  it('rejects a title that is too long', () => {
    expect(() =>
      createBookmarkSchema.parse({ title: 'x'.repeat(121), url: 'https://fastify.dev' }),
    ).toThrow();
  });

  it('rejects more than 10 tags', () => {
    const tags = Array.from({ length: 11 }, (_, i) => `tag-${i}`);
    expect(() =>
      createBookmarkSchema.parse({ title: 'x', url: 'https://fastify.dev', tags }),
    ).toThrow();
  });
});

describe('bookmarkSchema', () => {
  it('requires a uuid id and ISO timestamps', () => {
    expect(() =>
      bookmarkSchema.parse({
        id: 'not-a-uuid',
        title: 'x',
        url: 'https://fastify.dev',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    ).toThrow();
  });
});

describe('updateBookmarkSchema', () => {
  it('accepts a partial payload', () => {
    expect(updateBookmarkSchema.parse({ title: 'renamed' })).toEqual({ title: 'renamed' });
  });

  it('accepts an empty payload', () => {
    expect(updateBookmarkSchema.parse({})).toEqual({});
  });
});
