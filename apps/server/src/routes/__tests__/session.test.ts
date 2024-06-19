import { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterEach, beforeEach, expect, expectTypeOf, test, vi } from 'vitest';

import * as Fixtures from '../../../test/fixtures';
import { buildServer } from '../../app';
import { FetcherResponse } from '../../plugins/fetcher';
import { BootstrapResponse } from '../../types';
import { NectarSessionResponse } from '../session';

let app: FastifyInstance;
beforeEach(async () => {
  app = await buildServer({
    logger: {
      level: 'trace',
    },
  });
  await app.listen();
});

afterEach(async () => {
  await app.close();
  app = null;
});

const bootstrap200Anon = () =>
  new Promise<FetcherResponse<BootstrapResponse>>((res) =>
    res({
      statusCode: 200,
      body: Fixtures.bootstrapResponseAnonymous,
      headers: {
        'Set-Cookie': 'session=foo',
      },
    }),
  );

const fetcher500Response = () =>
  new Promise<FetcherResponse<string>>((res) =>
    res({
      statusCode: 500,
      body: 'Internal Error',
      headers: {},
    }),
  );

const fetcher429Response = () =>
  new Promise<FetcherResponse<string>>((res) =>
    res({
      statusCode: 429,
      body: 'Too Many Requests',
      headers: {},
    }),
  );

test('Regular flow, bootstrap then re-request', async () => {
  const fetcherSpy = vi.spyOn(app, 'fetcher');
  fetcherSpy.mockImplementation(bootstrap200Anon);
  const res = await request(app.server).get('/session');
  const body = JSON.parse(res.text);

  // should only bootstrap a single time
  expect(fetcherSpy).toHaveBeenCalledOnce();
  expect(fetcherSpy).toHaveBeenCalledWith({
    path: 'BOOTSTRAP',
    method: 'GET',
    headers: {
      cookie: undefined,
    },
  });
  const expectedResponse: NectarSessionResponse = {
    api: {
      token: Fixtures.bootstrapResponseAnonymous.access_token,
    },
    user: {
      name: Fixtures.bootstrapResponseAnonymous.username,
      settings: {},
      isAnonymous: true,
    },
  };

  // verify the response matches the fixture
  expectTypeOf(body).toMatchTypeOf<NectarSessionResponse>();
  expect(body).toStrictEqual<NectarSessionResponse>(expectedResponse);
  expect(res.headers).toHaveProperty('set-cookie');

  // now we can re-send along the cookie, it should *not* re-bootstrap
  const resWithSession = await request(app.server).get('/session').set('cookie', res.headers['set-cookie']);
  expect(JSON.parse(resWithSession.text)).toStrictEqual<NectarSessionResponse>(expectedResponse);
  // should not have had to bootstrap again
  expect(fetcherSpy).toHaveBeenCalledOnce();
});

test('429 response works properly', async () => {
  const fetcherSpy = vi.spyOn(app, 'fetcher');
  fetcherSpy.mockImplementation(fetcher429Response);
  const res = await request(app.server).get('/session');
  const body = JSON.parse(res.text);
  expect(body).toMatchInlineSnapshot(`
    {
      "actualError": ""Too Many Requests"",
      "friendlyMessage": "Too many requests. Please wait a moment and try again.",
    }
  `);
});

test('500 response works properly', async () => {
  const fetcherSpy = vi.spyOn(app, 'fetcher');
  fetcherSpy.mockImplementation(fetcher500Response);
  const res = await request(app.server).get('/session');
  const body = JSON.parse(res.text);
  expect(body).toMatchInlineSnapshot(`
    {
      "actualError": ""Internal Error"",
      "friendlyMessage": "An unexpected error occurred. Please try again later.",
    }
  `);
});
