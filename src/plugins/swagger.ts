import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

// Keep the OpenAPI version in sync with package.json. Resolve the path
// relative to this file so it works both from source (tsx, src/) and from
// the compiled output (dist/), where package.json sits two levels up.
const here = path.dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(readFileSync(path.join(here, '../../package.json'), 'utf8')) as {
  version: string;
};

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
        version,
      },
      servers: [{ url: 'http://localhost:3000' }],
    },
    transform: jsonSchemaTransform,
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });
}
