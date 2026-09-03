import { buildApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();

const app = await buildApp({ logLevel: config.logLevel });

// Graceful shutdown so Kubernetes can drain in-flight requests cleanly
// before killing the pod (SIGTERM is what `kubectl` sends on pod deletion).
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, async () => {
    app.log.info({ signal }, 'shutting down');
    await app.close();
    process.exit(0);
  });
}

try {
  // 0.0.0.0 so the container is reachable from inside the pod network.
  await app.listen({ port: config.port, host: config.host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
