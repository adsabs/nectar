import { server } from '@mocks/server';
import { IsomorphicResponse } from '@mswjs/interceptors';
import { setGlobalConfig } from '@storybook/testing-react';
import { GlobalConfig } from '@storybook/testing-react/dist/types';
import '@testing-library/jest-dom';
import { MockedRequest } from 'msw';
import * as globalStorybookConfig from './.storybook/preview';

setGlobalConfig(globalStorybookConfig as GlobalConfig);

// start mock server
beforeAll(function () {
  const onRequest = jest.fn<never, Parameters<(req: MockedRequest) => void>>();
  const onResponse = jest.fn<never, Parameters<(res: IsomorphicResponse, requestId: string) => void>>();
  server.events.on('request:start', onRequest);
  server.events.on('response:mocked', onResponse);
  globalThis.__mockServer__ = { ...server, onRequest, onResponse };
  server.listen();
});
afterEach(() => {
  server.resetHandlers();
  __mockServer__.onRequest.mockReset();
  __mockServer__.onResponse.mockReset();
});
afterAll(() => server.close());
