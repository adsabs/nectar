import api, { ApiTargets, IBootstrapPayload } from '@api';
import { APP_STORAGE_KEY } from '@store';
import { createServerListenerMocks } from '@test-utils';
import { rest } from 'msw';
import { map, path, pipe, repeat } from 'ramda';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

global.alert = vi.fn();

const mockUserData: Pick<IBootstrapPayload, 'username' | 'access_token' | 'anonymous' | 'expire_in'> = {
  username: 'anonymous@ads',
  access_token: 'yDCIgkpQjCrNWUqTfVbrrmBYImY6bJHWlHON45eq',
  anonymous: true,
  expire_in: '2099-03-22T14:50:07.712037',
};

const testHandler = rest.get('*test', (req, res, ctx) => {
  return res(ctx.status(200), ctx.json({ ok: true }));
});

const testRequest = (params?: Record<string, string>) =>
  api.request({
    method: 'GET',
    params,
    url: '/test',
  });

const urls = pipe<[Mock], Record<string, unknown>[], string[]>(
  path(['mock', 'calls']),
  map(path(['0', 'url', 'pathname'])),
);

describe('api', () => {
  beforeEach(() => api.reset());

  test('basic request calls bootstrap and adds auth', async ({ server }) => {
    const { onRequest: onReq, onResponse: onRes } = createServerListenerMocks(server);
    server.use(testHandler);

    await testRequest();

    expect(onReq).toBeCalledTimes(2);

    // first request was intercepted and bootstrapped
    expect(urls(onReq)[0]).toEqual(ApiTargets.BOOTSTRAP);

    const expectedToken = (JSON.parse(onRes.mock.calls[0][0].body) as IBootstrapPayload).access_token;

    expect(onReq.mock.calls[1][0].headers.get('authorization')).toEqual(`Bearer:${expectedToken}`);
    expect(onReq.mock.calls[1][0].headers.get('cookie')).toEqual('session=test-session');
  });

  test('passing token initially skips bootstrap', async ({ server }) => {
    const { onRequest: onReq, onResponse: onRes } = createServerListenerMocks(server);
    server.use(testHandler);
    api.setUserData(mockUserData);
    await testRequest();

    // only a single call since bootstrapping was unnecessary
    expect(onReq).toBeCalledTimes(1);
    expect(onReq.mock.calls[0][0].headers.get('authorization')).toEqual(`Bearer:${mockUserData.access_token}`);
    expect(onReq.mock.calls[0][0].headers.get('cookie')).toEqual('session=test-session');
  });

  test('expired userdata causes bootstrap', async ({ server }) => {
    const { onRequest: onReq, onResponse: onRes } = createServerListenerMocks(server);
    server.use(testHandler);
    api.setUserData({ ...mockUserData, expire_in: '1977-03-22T14:50:07.712037' });
    await testRequest();

    expect(onReq).toBeCalledTimes(2);
    expect(urls(onReq)[0]).toEqual(ApiTargets.BOOTSTRAP);
  });

  test('bootstrap is retried after error', async ({ server }) => {
    const { onRequest: onReq, onResponse: onRes } = createServerListenerMocks(server);
    server.use(testHandler);
    server.use(
      rest.get(`*${ApiTargets.BOOTSTRAP}`, (_, res, ctx) => {
        return res(ctx.status(500, 'Server Error'));
      }),
    );

    await expect(testRequest).rejects.toThrowError('Unrecoverable Error, unable to refresh token');

    expect(onReq).toBeCalledTimes(4);
    expect(urls(onReq).slice(0, 2)).toEqual(repeat(ApiTargets.BOOTSTRAP, 2));
  });

  test('if user data set in local storage, it is used instead of bootstrapping', async ({ server }) => {
    const { onRequest: onReq, onResponse: onRes } = createServerListenerMocks(server);
    server.use(testHandler);
    global.localStorage.setItem(
      APP_STORAGE_KEY,
      JSON.stringify({ state: { user: { ...mockUserData, access_token: 'from-local-storage' } } }),
    );

    await testRequest();
    expect(onReq).toBeCalledTimes(1);
    expect(onReq.mock.calls[0][0].headers.get('authorization')).toEqual(`Bearer:from-local-storage`);
    global.localStorage.clear();
  });

  test('expired user data set in local storage causes bootstrap', async ({ server }) => {
    const { onRequest: onReq, onResponse: onRes } = createServerListenerMocks(server);
    server.use(testHandler);
    global.localStorage.setItem(
      APP_STORAGE_KEY,
      JSON.stringify({
        state: {
          user: { ...mockUserData, access_token: 'from-local-storage', expire_in: '1900-03-22T14:50:07.712037' },
        },
      }),
    );

    await testRequest();
    expect(onReq).toBeCalledTimes(2);
    expect(urls(onReq)[0]).toEqual(ApiTargets.BOOTSTRAP);
    global.localStorage.clear();
  });

  test('401 response triggers bootstrap to refresh token', async ({ server }) => {
    const { onRequest: onReq, onResponse: onRes } = createServerListenerMocks(server);
    server.use(testHandler);
    server.use(
      rest.get('*test', (req, res, ctx) => {
        return res.once(ctx.status(401), ctx.json({ error: 'Not Authorized' }));
      }),
    );

    const { data } = await testRequest();
    expect(data).toEqual({ ok: true });
    expect(onReq).toBeCalledTimes(4);
    expect(urls(onReq)).toEqual([
      // initial bootstrap because we don't have any userData stored
      ApiTargets.BOOTSTRAP,

      // this request will fail, triggering a refresh
      '/test',

      // refresh and retry original request
      ApiTargets.BOOTSTRAP,
      '/test',
    ]);
  });

  test('401 does not cause infinite loop if refresh fails', async ({ server }) => {
    const { onRequest: onReq, onResponse: onRes } = createServerListenerMocks(server);
    server.use(testHandler);
    server.use(
      rest.get('*test', (req, res, ctx) => {
        return res.once(ctx.status(401), ctx.json({ error: 'Not Authorized' }));
      }),
      rest.get(`*${ApiTargets.BOOTSTRAP}`, (_, res, ctx) => {
        return res.once(ctx.status(200), ctx.json(mockUserData));
      }),
      rest.get(`*${ApiTargets.BOOTSTRAP}`, (_, res, ctx) => {
        return res(ctx.status(500, 'Server Error'));
      }),
    );

    await expect(testRequest).rejects.toThrowError('Unrecoverable Error, unable to refresh token');

    expect(onReq).toBeCalledTimes(6);
    expect(urls(onReq)).toEqual([
      // initial bootstrap since we don't have userData
      ApiTargets.BOOTSTRAP,

      // this request will fail
      '/test',

      // all bootstrap calls will repeat since the rest fail, initial + 3 retries
      ...repeat(ApiTargets.BOOTSTRAP, 4),
    ]);
  });

  test('401 with initial bootstrap failure works properly', async ({ server }) => {
    const { onRequest: onReq, onResponse: onRes } = createServerListenerMocks(server);
    server.use(testHandler);
    server.use(
      rest.get('*test', (req, res, ctx) => {
        return res.once(ctx.status(401), ctx.json({ error: 'Not Authorized' }));
      }),
      rest.get(`*${ApiTargets.BOOTSTRAP}`, (_, res, ctx) => {
        return res.once(ctx.status(200), ctx.json(mockUserData));
      }),
      rest.get(`*${ApiTargets.BOOTSTRAP}`, (_, res, ctx) => {
        return res.once(ctx.status(500, 'Server Error'));
      }),
    );

    const { data } = await testRequest();
    expect(data).toEqual({ ok: true });

    expect(onReq).toBeCalledTimes(5);
    expect(urls(onReq)).toEqual([
      // initial bootstrap, this one succeeds
      ApiTargets.BOOTSTRAP,

      // 401 response
      '/test',

      // this bootstrap will fail, second succeeds
      ...repeat(ApiTargets.BOOTSTRAP, 2),

      // authenticated request succeeds
      '/test',
    ]);
  });
});
