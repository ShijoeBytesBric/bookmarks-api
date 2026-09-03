import { describe, expect, it } from 'vitest';

import { loadConfig } from '../../src/config.js';

describe('loadConfig', () => {
  it('uses defaults when the environment is empty', () => {
    expect(loadConfig({})).toEqual({ port: 3000, host: '0.0.0.0', logLevel: 'info' });
  });

  it('parses PORT, HOST and LOG_LEVEL from the environment', () => {
    const config = loadConfig({ PORT: '8080', HOST: '127.0.0.1', LOG_LEVEL: 'warn' });
    expect(config).toEqual({ port: 8080, host: '127.0.0.1', logLevel: 'warn' });
  });

  it('falls back to the default port when PORT is not a positive integer', () => {
    expect(loadConfig({ PORT: 'abc' }).port).toBe(3000);
    expect(loadConfig({ PORT: '-1' }).port).toBe(3000);
    expect(loadConfig({ PORT: '0' }).port).toBe(3000);
  });

  it('trims whitespace from HOST and LOG_LEVEL', () => {
    expect(loadConfig({ HOST: ' 0.0.0.0 ', LOG_LEVEL: ' info ' })).toEqual({
      port: 3000,
      host: '0.0.0.0',
      logLevel: 'info',
    });
  });
});
