import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../../src/app.js';
import { createInMemoryBookmarkRepository } from '../../src/modules/bookmarks/repository.js';

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

describe('Bookmarks API', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp({ repository: createInMemoryBookmarkRepository(), logger: false });
  });

  afterEach(async () => {
    await app.close();
  });

  it('starts with an empty list', async () => {
    const res = await app.inject({ method: 'GET', url: '/bookmarks' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });

  it('creates a bookmark and returns it with a generated id', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/bookmarks',
      payload: { title: 'Fastify docs', url: 'https://fastify.dev', tags: ['node'] },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.title).toBe('Fastify docs');
  });

  it('rejects an invalid bookmark payload with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/bookmarks',
      payload: { title: 'Fastify docs', url: 'not-a-url' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for an unknown bookmark', async () => {
    const res = await app.inject({ method: 'GET', url: `/bookmarks/${UNKNOWN_ID}` });

    expect(res.statusCode).toBe(404);
  });

  it('updates a bookmark in place', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/bookmarks',
      payload: { title: 'Fastify docs', url: 'https://fastify.dev' },
    });

    const put = await app.inject({
      method: 'PUT',
      url: `/bookmarks/${created.json().id}`,
      payload: { title: 'Fastify v5 docs' },
    });

    expect(put.statusCode).toBe(200);
    expect(put.json().title).toBe('Fastify v5 docs');
    expect(put.json().url).toBe('https://fastify.dev');
  });

  it('returns 404 when updating an unknown bookmark', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/bookmarks/${UNKNOWN_ID}`,
      payload: { title: 'nope' },
    });

    expect(res.statusCode).toBe(404);
  });

  it('deletes a bookmark, then reports it gone', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/bookmarks',
      payload: { title: 'Fastify docs', url: 'https://fastify.dev' },
    });

    const del = await app.inject({ method: 'DELETE', url: `/bookmarks/${created.json().id}` });
    expect(del.statusCode).toBe(204);

    const gone = await app.inject({ method: 'DELETE', url: `/bookmarks/${created.json().id}` });
    expect(gone.statusCode).toBe(404);
  });

  it('serves an OpenAPI spec describing the health and bookmarks endpoints', async () => {
    const res = await app.inject({ method: 'GET', url: '/docs/json' });

    expect(res.statusCode).toBe(200);
    const spec = res.json();
    // @fastify/swagger currently emits 3.0.3 — assert it's OpenAPI 3.x rather
    // than pinning a minor version, since the real point is that the zod
    // schemas are generating a spec at all.
    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.paths).toHaveProperty('/health');
    expect(spec.paths).toHaveProperty('/bookmarks');
  });
});
