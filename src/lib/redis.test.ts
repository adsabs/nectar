import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('ioredis', () => {
  class MockRedis extends EventEmitter {
    status = 'ready';

    constructor() {
      super();
      setImmediate(() => {
        this.emit('ready');
      });
    }

    async ping(): Promise<string> {
      return 'PONG';
    }

    async quit(): Promise<string> {
      return 'OK';
    }
  }

  return {
    __esModule: true,
    default: MockRedis,
  };
});

const waitForReady = () => new Promise((resolve) => setImmediate(resolve));

describe('redis singleton', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6380';
    process.env.REDIS_PASSWORD = 'secret';
  });

  afterEach(() => {
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.REDIS_PASSWORD;
  });

  it('returns a redis client instance', async () => {
    const { getRedisClient } = await import('./redis');
    const client = getRedisClient();

    expect(client).not.toBeNull();
    expect(typeof client?.ping).toBe('function');
  });

  it('returns the same instance on subsequent calls', async () => {
    const { getRedisClient } = await import('./redis');

    const first = getRedisClient();
    const second = getRedisClient();

    expect(first).toBe(second);
  });

  it('reports availability as true when client exists', async () => {
    const { getRedisClient, isRedisAvailable } = await import('./redis');

    getRedisClient();
    await waitForReady();

    expect(isRedisAvailable()).toBe(true);
  });

  it('returns null and unavailable when REDIS_HOST is missing', async () => {
    delete process.env.REDIS_HOST;

    const { getRedisClient, isRedisAvailable } = await import('./redis');
    const client = getRedisClient();

    expect(client).toBeNull();
    expect(isRedisAvailable()).toBe(false);
  });
});
