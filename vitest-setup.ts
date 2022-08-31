import { cleanup } from '@test-utils';
import matchers from '@testing-library/jest-dom/matchers';
import { afterAll, afterEach, beforeAll, beforeEach, expect } from 'vitest';
import { server } from './src/mocks/server';

expect.extend(matchers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach((context) => {
  // add the server to the context
  context.server = server;
});
afterAll(() => server.close());
afterEach(() => {
  server.resetHandlers();
  server.events.removeAllListeners();
  cleanup();
});
