import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

/**
 * Registers OpenAPI docs for the app.
 * `jsonSchemaTransform` converts the routes' zod schemas into JSON Schema so
 * the generated spec stays in sync with the implementation — an integration
 * test asserts the spec is non-empty. Interactive UI at /docs, spec at /docs/json.
 */
export async function registerSwagger(app: FastifyInstance): Promise<void> {
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Bookmarks API',
        description:
          'A small REST API used to demonstrate a production-grade CI/CD pipeline ' +
          '(GitHub Actions -> GHCR -> Kubernetes).',
        version: '0.1.0',
      },
      servers: [{ url: 'http://localhost:3000' }],
    },
    transform: jsonSchemaTransform,
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });
}
