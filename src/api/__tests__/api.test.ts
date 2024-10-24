import api, { ApiRequestConfig } from '@/api/api';
import { APP_STORAGE_KEY } from '@/store';
import { createServerListenerMocks } from '@/test-utils';
import { rest } from 'msw';
import { map, path, pipe } from 'ramda';
import { beforeEach, expect, Mock, test, TestContext, vi } from 'vitest';
import { IBootstrapPayload } from '@/api/user/types';
import { ApiTargets } from '@/api/models';

global.alert = vi.fn();

const API_USER = '/api/user';

const mockUserData: Pick<IBootstrapPayload, 'username' | 'access_token' | 'anonymous' | 'expire_in'> = {
  username: 'anonymous@ads',
  access_token: 'foo_access_token',
  anonymous: true,
  expire_in: '2099-03-22T14:50:07.712037',
};
const invalidMockUserData: Pick<IBootstrapPayload, 'username' | 'access_token' | 'anonymous' | 'expire_in'> = {
  username: 'anonymous@ads',
  access_token: '',
  anonymous: true,
  expire_in: '',
};

const testHandler = rest.get('*test', (_, res, ctx) => {
  return res(ctx.status(200), ctx.json({ ok: true }));
});

const unAuthorizedHandler = rest.get('*test', (_, res, ctx) =>
  res(ctx.status(401), ctx.json({ message: 'User unauthorized' })),
);

const unAuthorizedRequest = () => api.request({ method: 'GET', url: '/test' });

const testRequest = (params?: Record<string, string>, config: Partial<ApiRequestConfig> = {}) =>
  api.request({
    method: 'GET',
    params,
    url: '/test',
    ...config,
  });

const urls = pipe<[Mock], Record<string, unknown>[], string[]>(
  path(['mock', 'calls']),
  map(path(['0', 'url', 'pathname'])),
);

const dig = (paths: string[]) =>
  pipe<[Mock], Record<string, unknown>[], string[]>(path(['mock', 'calls']), map(path(['0', ...paths])));

beforeEach(() => {
  localStorage.clear();
  api.reset();
});

test('User data is found and used if set directly on api instance', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);
  server.use(testHandler);

  // user data can be found if
  api.setUserData({ ...mockUserData, access_token: 'from-memory' });
  await testRequest();
  expect(onReq).toHaveBeenCalledOnce();
  expect(onReq.mock.calls[0][0].headers.get('authorization')).toEqual(`Bearer from-memory`);
});

test('User data is found and used if set in local storage', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);
  server.use(testHandler);

  // user data located in local storage
  localStorage.setItem(
    APP_STORAGE_KEY,
    JSON.stringify({ state: { user: { ...mockUserData, access_token: 'from-local-storage' } } }),
  );
  await testRequest();
  expect(onReq).toHaveBeenCalledOnce();
  expect(onReq.mock.calls[0][0].headers.get('authorization')).toEqual(`Bearer from-local-storage`);
});

test('Attempts to get user data from server without refresh', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);
  server.use(testHandler);
  server.use(
    rest.get(`*${API_USER}`, (_, res, ctx) => {
      return res(ctx.status(200), ctx.json({ user: { ...mockUserData, access_token: 'from-session' } }));
    }),
  );

  await testRequest();
  expect(dig(['url', 'pathname'])(onReq)).toEqual([
    // called to get the token from the session
    API_USER,

    // continued with the regular request
    '/test',
  ]);

  expect(onReq.mock.calls[1][0].headers.get('authorization')).toBe(`Bearer from-session`);
});

test('Unauthenticated request with no previous session, will force a token refresh', async ({
  server,
}: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);
  server.use(testHandler);
  server.use(
    rest.get(`*${API_USER}`, (_, res, ctx) => {
      return res.once(ctx.status(500), ctx.json({ error: 'Server Error' }));
    }),
    rest.get(`*${API_USER}`, (_, res, ctx) => {
      return res(ctx.status(200), ctx.json({ user: { ...mockUserData, access_token: 'refreshed' } }));
    }),
  );

  await testRequest();

  expect(onReq).toBeCalledTimes(3);

  expect(urls(onReq)).toStrictEqual([
    // tries to get user data from session (this will fail)
    API_USER,

    // Refreshes token via the /api/user endpoint
    API_USER,

    // sends original request
    '/test',
  ]);

  // the refresh header was added to force a new session
  expect(onReq.mock.calls[1][0].headers.get('x-refresh-token')).toEqual('1');
  expect(onReq.mock.calls[2][0].headers.get('authorization')).toEqual(`Bearer refreshed`);
});

test('Fallback to bootstrapping directly if the /api/user endpoint continuously fails', async ({
  server,
}: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);
  server.use(testHandler);
  server.use(
    rest.get(`*${API_USER}`, (_, res, ctx) => {
      return res(ctx.status(500), ctx.json({ error: 'Server Error' }));
    }),
  );

  await testRequest();

  expect(onReq).toBeCalledTimes(4);

  expect(urls(onReq)).toStrictEqual([
    // tries to get user data from session (this will fail)
    API_USER,

    // Refreshes token via the /api/user endpoint (this will fail also)
    API_USER,

    // falls back to api bootstrap call
    ApiTargets.BOOTSTRAP,

    // sends original request
    '/test',
  ]);

  // the refresh header was added to force a new session
  expect(onReq.mock.calls[3][0].headers.get('authorization')).toMatchInlineSnapshot(
    '"Bearer ------ mocked token ---------"',
  );
});

test('passing token initially skips bootstrap', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);
  server.use(testHandler);
  api.setUserData(mockUserData);
  await testRequest();

  // only a single call since bootstrapping was unnecessary
  expect(onReq).toBeCalledTimes(1);
  expect(onReq.mock.calls[0][0].headers.get('authorization')).toEqual(`Bearer ${mockUserData.access_token}`);
  expect(onReq.mock.calls[0][0].headers.get('cookie')).toEqual('session=test-session');
});

test('expired userdata causes bootstrap', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);
  server.use(testHandler);
  api.setUserData({ ...mockUserData, expire_in: '1977-03-22T14:50:07.712037' });
  await testRequest();

  expect(onReq).toBeCalledTimes(2);
  expect(urls(onReq)[0]).toEqual(API_USER);
});

test('401 response refreshes token properly', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);
  server.use(testHandler);
  server.use(
    rest.get('*test', (_, res, ctx) => {
      return res.once(ctx.status(401), ctx.json({ error: 'Not Authorized' }));
    }),
  );

  const { data } = await testRequest();
  expect(data).toEqual({ ok: true });
  expect(onReq).toBeCalledTimes(4);
  expect(urls(onReq)).toEqual([
    // initial bootstrap because we don't have any userData stored
    API_USER,

    // this request will fail, triggering a refresh
    '/test',

    // refresh and retry original request
    API_USER,
    '/test',
  ]);

  expect(onReq.mock.calls[2][0].headers.get('x-refresh-token')).toEqual('1');
});

test('401 does not cause infinite loop if refresh repeatedly fails', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);
  server.use(testHandler);
  server.use(
    rest.get('*test', (_, res, ctx) => {
      return res.once(ctx.status(401), ctx.json({ error: 'Not Authorized' }));
    }),
    rest.get(`*${API_USER}`, (_, res, ctx) => {
      return res.once(ctx.status(200), ctx.json({ user: mockUserData, isAuthenticated: false }));
    }),
    rest.get(`*${API_USER}`, (_, res, ctx) => {
      return res(ctx.status(401, 'Unauthenticated'));
    }),
    rest.get(`*${ApiTargets.BOOTSTRAP}`, (_, res, ctx) => {
      return res(ctx.status(401, 'Unauthenticated'));
    }),
  );

  await expect(testRequest).rejects.toThrowErrorMatchingInlineSnapshot('"Unable to obtain API access"');

  expect(onReq).toBeCalledTimes(4);
  expect(urls(onReq)).toEqual([
    // initial bootstrap since we don't have userData
    API_USER,

    // this request will fail
    '/test',

    // refresh from server
    API_USER,

    // refresh directly by bootstrapping
    ApiTargets.BOOTSTRAP,
  ]);
  expect(onReq.mock.calls[2][0].headers.get('x-refresh-token')).toEqual('1');
});

/**
 * This tests the case that a request has a valid token, but for some
 * reason is still giving a 401 after refetching the token
 */
test('repeated 401s do not cause infinite loop', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);
  server.use(unAuthorizedHandler);

  await expect(unAuthorizedRequest).rejects.toThrowError();

  expect(onReq).toBeCalledTimes(4);
  expect(urls(onReq)).toEqual([
    // successful
    API_USER,

    // 401
    '/test',

    // successful
    API_USER,

    // 401 again, this should throw an error and abort re-bootstrapping
    '/test',
  ]);
});

test('request fails without a response body are rejected', async ({ server }: TestContext) => {
  server.use(rest.get('*test', (_, res, ctx) => res(ctx.delay('infinite'), ctx.status(400, 'error'))));

  // simulates a timeout, by aborting the request after a timeout
  const control = new AbortController();
  setTimeout(() => control.abort(), 50);
  await expect(testRequest({}, { signal: control.signal })).rejects.toThrowError();
});

test('request rejects if the refreshed user data is not valid', async ({ server }: TestContext) => {
  server.use(
    unAuthorizedHandler,
    rest.get(`*${API_USER}`, (_, res, ctx) => {
      return res.once(ctx.status(200), ctx.json({ user: invalidMockUserData, isAuthenticated: false }));
    }),
    rest.get(`*${ApiTargets.BOOTSTRAP}`, (_, res, ctx) => {
      return res.once(ctx.status(200), ctx.json(invalidMockUserData));
    }),
  );
  global.localStorage.setItem(
    APP_STORAGE_KEY,
    JSON.stringify({ state: { user: { ...mockUserData, access_token: 'from-local-storage' } } }),
  );
  const { onRequest: onReq } = createServerListenerMocks(server);

  api.setUserData(mockUserData);

  await expect(testRequest).rejects.toThrowError();

  // after the 401 from `test` we try to bootstrap, it's invalid so we reject
  expect(onReq).toBeCalledTimes(3);
  expect(urls(onReq)).toStrictEqual(['/test', API_USER, ApiTargets.BOOTSTRAP]);
  expect(onReq.mock.calls[1][0].headers.get('x-refresh-token')).toEqual('1');
});
