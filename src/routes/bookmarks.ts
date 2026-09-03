import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import type { BookmarkRepository } from '../modules/bookmarks/repository.js';
import {
  bookmarkIdSchema,
  bookmarkSchema,
  createBookmarkSchema,
  updateBookmarkSchema,
} from '../modules/bookmarks/schema.js';

const notFoundSchema = z.object({ message: z.string() });

/**
 * Full CRUD for bookmarks.
 *
 * Validation is declared with zod schemas and the ZodTypeProvider:
 * Fastify answers 400 automatically on invalid body/params, and
 * @fastify/swagger generates the OpenAPI spec straight from these schemas.
 */
export async function registerBookmarkRoutes(
  app: FastifyInstance,
  repository: BookmarkRepository,
): Promise<void> {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/bookmarks',
    {
      schema: {
        response: { 200: z.array(bookmarkSchema) },
      },
    },
    async () => repository.list(),
  );

  server.post(
    '/bookmarks',
    {
      schema: {
        body: createBookmarkSchema,
        response: { 201: bookmarkSchema },
      },
    },
    async (request, reply) => {
      const bookmark = await repository.create(request.body);
      return reply.code(201).send(bookmark);
    },
  );

  server.get(
    '/bookmarks/:id',
    {
      schema: {
        params: bookmarkIdSchema,
        response: { 200: bookmarkSchema, 404: notFoundSchema },
      },
    },
    async (request, reply) => {
      const bookmark = await repository.getById(request.params.id);
      if (!bookmark) {
        return reply.code(404).send({ message: 'Bookmark not found' });
      }
      return bookmark;
    },
  );

  server.put(
    '/bookmarks/:id',
    {
      schema: {
        params: bookmarkIdSchema,
        body: updateBookmarkSchema,
        response: { 200: bookmarkSchema, 404: notFoundSchema },
      },
    },
    async (request, reply) => {
      const bookmark = await repository.update(request.params.id, request.body);
      if (!bookmark) {
        return reply.code(404).send({ message: 'Bookmark not found' });
      }
      return bookmark;
    },
  );

  server.delete(
    '/bookmarks/:id',
    {
      schema: {
        params: bookmarkIdSchema,
        response: { 204: z.void(), 404: notFoundSchema },
      },
    },
    async (request, reply) => {
      const deleted = await repository.delete(request.params.id);
      if (!deleted) {
        return reply.code(404).send({ message: 'Bookmark not found' });
      }
      return reply.code(204).send();
    },
  );
}
