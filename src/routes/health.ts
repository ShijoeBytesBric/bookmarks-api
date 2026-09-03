import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

/**
 * Health probe used at every layer of the pipeline:
 *  - Docker HEALTHCHECK
 *  - Kubernetes liveness + readiness probes
 *  - CI/CD smoke test (curl /health)
 */
export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/health',
    {
      schema: {
        response: {
          200: z.object({
            status: z.enum(['ok']),
            uptime: z.number(),
            timestamp: z.iso.datetime(),
          }),
        },
      },
    },
    async () => ({
      status: 'ok' as const,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }),
  );
}
