export interface AppConfig {
  port: number;
  host: string;
  logLevel: string;
}

const DEFAULTS: AppConfig = {
  port: 3000,
  host: '0.0.0.0',
  logLevel: 'info',
};

/**
 * Loads a typed, validated config from the environment.
 * Deliberately dependency-free — this project is small enough that a full
 * env-schema plugin would be overkill.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsedPort = Number.parseInt(env.PORT ?? '', 10);
  return {
    port: Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : DEFAULTS.port,
    host: env.HOST?.trim() || DEFAULTS.host,
    logLevel: env.LOG_LEVEL?.trim() || DEFAULTS.logLevel,
  };
}
