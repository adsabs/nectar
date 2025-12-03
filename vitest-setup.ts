import { cleanup } from '@/test-utils';
import type { TestContext } from 'vitest';
import { afterAll, afterEach, beforeAll, beforeEach, expect, vi } from 'vitest';
import { server } from '@/mocks/server';
import matchers from '@testing-library/jest-dom/matchers';

import { TextDecoder, TextEncoder } from 'util';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import replaceAllInserter from 'string.prototype.replaceall';
import { SetupServerApi } from 'msw/node';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
replaceAllInserter.shim();

expect.extend(matchers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach((context: TestContext) => {
  // add the server to the context
  context.server = server as SetupServerApi;
});
afterAll(() => server.close());
afterEach(() => {
  server.resetHandlers();
  server.events.removeAllListeners();
  cleanup();
});

// workaround for `env.window.matchMedia is not a function` error
// @see https://github.com/vitest-dev/vitest/issues/821#issuecomment-1046954558
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: unknown) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Guard against invalid selectors produced by third-party components in jsdom.
const nativeMatches = Element.prototype.matches;
Element.prototype.matches = function patchedMatches(selector: string): boolean {
  try {
    return nativeMatches.call(this, selector);
  } catch (error) {
    if ((error as DOMException)?.name === 'SyntaxError') {
      return false;
    }
    throw error;
  }
};

const nativeQuerySelector = Element.prototype.querySelector;
Element.prototype.querySelector = function patchedQuerySelector(selectors: string): Element | null {
  try {
    return nativeQuerySelector.call(this, selectors);
  } catch (error) {
    if ((error as DOMException)?.name === 'SyntaxError') {
      return null;
    }
    throw error;
  }
};

const nativeQuerySelectorAll = Element.prototype.querySelectorAll;
Element.prototype.querySelectorAll = function patchedQuerySelectorAll(selectors: string): NodeListOf<Element> {
  try {
    return nativeQuerySelectorAll.call(this, selectors);
  } catch (error) {
    if ((error as DOMException)?.name === 'SyntaxError') {
      return document.createDocumentFragment().querySelectorAll('*');
    }
    throw error;
  }
};
