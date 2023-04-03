import {cleanup} from '@test-utils';
import matchers from '@testing-library/jest-dom/matchers';
import {afterAll, afterEach, beforeAll, beforeEach, expect} from 'vitest';
import {server} from '@mocks/server';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import replaceAllInserter from 'string.prototype.replaceall';
// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
replaceAllInserter.shim();

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
