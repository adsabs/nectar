import api, { ApiTargets, IBootstrapPayload } from '@api';
import { handlers } from '@mocks/handlers';
import { IsomorphicResponse } from '@mswjs/interceptors';
import { APP_STORAGE_KEY } from '@store';
import { MockedRequest, rest } from 'msw';
import { setupServer } from 'msw/node';

global.alert = jest.fn();

const mockUserData: Pick<IBootstrapPayload, 'username' | 'access_token' | 'anonymous' | 'expire_in'> = {
  username: 'anonymous@ads',
  access_token: 'yDCIgkpQjCrNWUqTfVbrrmBYImY6bJHWlHON45eq',
  anonymous: true,
  expire_in: '2099-03-22T14:50:07.712037',
};

const server = setupServer(
  ...handlers,
  rest.get('*test', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ ok: 'true' }));
  }),
);

const setup = () => {
  const onReq = jest.fn<never, Parameters<(req: MockedRequest) => void>>();
  const onRes = jest.fn<never, Parameters<(res: IsomorphicResponse, requestId: string) => void>>();
  server.events.on('request:start', onReq);
  server.events.on('response:mocked', onRes);
  const testRequest = async (params?: Record<string, string>) => {
    void (await api.request({
      method: 'GET',
      params,
      url: '/test',
    }));
  };

  return { onReq, onRes, testRequest };
};

describe('api', () => {
  beforeAll(() => server.listen());
  beforeEach(() => {
    api.reset();
    server.resetHandlers();
  });
  afterAll(() => server.close());

  test('basic request calls bootstrap and adds auth', async () => {
    const { onReq, onRes, testRequest } = setup();
    await testRequest();

    expect(onReq).toBeCalledTimes(2);
    expect(onReq.mock.calls[0]);

    // first request was intercepted and bootstrapped
    expect(onReq.mock.calls[0][0].url.pathname).toEqual(ApiTargets.BOOTSTRAP);

    const expectedToken = (JSON.parse(onRes.mock.calls[0][0].body) as IBootstrapPayload).access_token;

    expect(onReq.mock.calls[1][0].headers.get('authorization')).toEqual(`Bearer:${expectedToken}`);
    expect(onReq.mock.calls[1][0].headers.get('cookie')).toEqual('session=test-session');
  });

  test('passing token initially skips bootstrap', async () => {
    const { onReq, testRequest } = setup();
    api.setUserData(mockUserData);
    await testRequest();

    // only a single call since bootstrapping was unnecessary
    expect(onReq).toBeCalledTimes(1);
    expect(onReq.mock.calls[0]);
    expect(onReq.mock.calls[0][0].headers.get('authorization')).toEqual(`Bearer:${mockUserData.access_token}`);
    expect(onReq.mock.calls[0][0].headers.get('cookie')).toEqual('session=test-session');
  });

  test('expired userdata causes bootstrap', async () => {
    const { onReq, testRequest } = setup();
    api.setUserData({ ...mockUserData, expire_in: '1977-03-22T14:50:07.712037' });
    await testRequest();

    expect(onReq).toBeCalledTimes(2);
    expect(onReq.mock.calls[0][0].url.pathname).toEqual(ApiTargets.BOOTSTRAP);
  });

  test('bootstrap is retried after error', async () => {
    const { onReq, testRequest } = setup();

    server.use(
      rest.get(`*${ApiTargets.BOOTSTRAP}`, (_, res, ctx) => {
        return res(ctx.status(500, 'Server Error'));
      }),
    );

    await testRequest();

    expect(onReq).toBeCalledTimes(4);
    onReq.mock.calls.slice(0, 2).forEach((c) => {
      expect(c[0].url.pathname).toEqual(ApiTargets.BOOTSTRAP);
    });

    // finally an error is shown if we can't bootstrap requests
    expect(global.alert).toBeCalled();
  });

  test('if user data set in local storage, it is used instead of bootstrapping', async () => {
    const { onReq, testRequest } = setup();
    global.localStorage.setItem(
      APP_STORAGE_KEY,
      JSON.stringify({ state: { user: { ...mockUserData, access_token: 'from-local-storage' } } }),
    );

    await testRequest();
    expect(onReq).toBeCalledTimes(1);
    expect(onReq.mock.calls[0]);
    expect(onReq.mock.calls[0][0].headers.get('authorization')).toEqual(`Bearer:from-local-storage`);
    global.localStorage.clear();
  });
});
