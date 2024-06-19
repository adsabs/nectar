import { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterEach, beforeEach, test } from 'vitest';

import { buildServer } from '../../app';

describe('bootstrapToken', () => {
  let app: FastifyInstance;
  beforeEach(async () => {
    app = await buildServer({
      logger: {
        level: 'trace',
      },
    });
    pawait app.listen();
  });

  afterEach(async () => {
    await app.close();
    app = null;
  });

  test('Bootstrap token', async () => {
    const res = await request(app.server).get('/session');
    const body = JSON.parse(res.text);
  });
});
