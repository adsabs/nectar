import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NavBar } from '../NavBar';
import { AppMode } from '@/types';
import { render, waitFor } from '@/test-utils';
import { NextRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';

const createMockRouter = (initial: Partial<NextRouter> = {}): NextRouter => {
  const router: Partial<NextRouter> = {
    basePath: '',
    pathname: '/',
    route: '/',
    asPath: '/',
    query: {},
    isReady: true,
    isLocaleDomain: false,
    isPreview: false,
    isFallback: false,
    push: vi.fn().mockResolvedValue(true),
    replace: vi.fn().mockResolvedValue(true),
    reload: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn().mockResolvedValue(undefined),
    beforePopState: vi.fn(),
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
    ...initial,
  };

  // Mock a stateful replace implementation to reflect URL changes
  router.replace = vi.fn().mockImplementation((url: string | { pathname?: string; query?: ParsedUrlQuery }) => {
    if (typeof url === 'object') {
      if (url.pathname) {
        router.pathname = url.pathname;
      }
      if (url.query) {
        router.query = url.query;
      }
    }
    return Promise.resolve(true);
  });

  return router as NextRouter;
};

Object.defineProperty(HTMLElement.prototype, 'focus', {
  configurable: true,
  get() {
    return vi.fn();
  },
  set() {
    // noop setter to satisfy focus-visible patching in jsdom
  },
});

let mockRouter: NextRouter;

vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

describe('AppModeUrlNotice', () => {
  // Use beforeEach to ensure a fresh router for each test, preventing test pollution.
  beforeEach(() => {
    mockRouter = createMockRouter();
  });

  it('applies discipline from URL param on /search and shows notice with switch back', async () => {
    // The notice logic only runs on /search, so we must set the pathname.
    mockRouter = createMockRouter({ query: { d: 'heliophysics' }, pathname: '/search' });

    const { getByTestId, queryByTestId, user } = render(<NavBar />, { initialStore: { mode: AppMode.ASTROPHYSICS } });

    await waitFor(() => expect(getByTestId('app-mode-url-notice')).toBeInTheDocument());
    expect(getByTestId('app-mode-url-notice').textContent).toContain('Heliophysics');

    await user.click(getByTestId('app-mode-url-notice-switch-back'));
    await waitFor(() => expect(queryByTestId('app-mode-url-notice')).not.toBeInTheDocument());
    expect(mockRouter.query.d).toBe('astrophysics');
  });

  it('does nothing when URL param is missing', async () => {
    mockRouter = createMockRouter({ pathname: '/search' }); // No 'd' param

    const { queryByTestId } = render(<NavBar />, { initialStore: { mode: AppMode.ASTROPHYSICS } });

    // The notice should not appear. A brief wait ensures async effects have settled.
    await new Promise((r) => setTimeout(r, 50));
    expect(queryByTestId('app-mode-url-notice')).toBeNull();
  });

  it('normalizes uppercase discipline param to lowercase in the URL', async () => {
    mockRouter = createMockRouter({ query: { d: 'HELIOPHYSICS' }, pathname: '/search' });

    render(<NavBar />, { initialStore: { mode: AppMode.GENERAL } });

    // The notice logic detects the mismatched case and triggers a router.replace
    // to normalize the URL param.
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalled();
    });

    // The mock's stateful replace implementation updates the query object.
    expect(mockRouter.query.d).toBe('heliophysics');
  });
});
