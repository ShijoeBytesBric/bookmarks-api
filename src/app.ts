import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

import { createInMemoryBookmarkRepository } from './modules/bookmarks/repository.js';
import type { BookmarkRepository } from './modules/bookmarks/repository.js';
import { registerSwagger } from './plugins/swagger.js';
import { registerBookmarkRoutes } from './routes/bookmarks.js';
import { registerHealthRoutes } from './routes/health.js';

export interface AppOptions {
  /** Inject a repository (used by tests); defaults to a fresh in-memory repo. */
  repository?: BookmarkRepository;
  logLevel?: string;
  /** Pass `false` to silence pino (used by tests). */
  logger?: boolean;
}

/**
 * Builds the Fastify app without listening — tests drive it via app.inject().
 * The app/server split is what makes the integration tests possible without
 * opening sockets or pulling in supertest.
 */
export async function buildApp(options: AppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? { level: options.logLevel ?? 'info' },
  });

  // Wire the zod type provider so route schemas validate AND generate OpenAPI.
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  const repository = options.repository ?? createInMemoryBookmarkRepository();

  // NOTE: these are called directly (not via app.register) so they run on the
  // ROOT instance. If they were registered as plugins they'd run in an
  // encapsulated child, and @fastify/swagger's onRoute collector + swagger()
  // decorator would live on that child — invisible to the routes below.
  await registerSwagger(app);
  await registerHealthRoutes(app);
  await registerBookmarkRoutes(app, repository);

  return app;
}
