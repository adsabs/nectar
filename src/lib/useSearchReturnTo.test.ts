import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getSessionItem, SessionStorageKey, setSessionItem } from '@/lib/session/sessionStore';
import {
  captureSearchReturnUrl,
  clearSearchReturnUrl,
  useCaptureSearchReturnUrl,
  useSearchReturnTo,
} from './useSearchReturnTo';

const KEY = SessionStorageKey.SearchReturnUrl;

const router = {
  isReady: true,
  pathname: '/search',
  asPath: '/search?q=star',
  query: { q: 'star' } as Record<string, string | string[] | undefined>,
};

vi.mock('next/router', () => ({
  useRouter: () => router,
}));

const resetRouter = () => {
  router.isReady = true;
  router.pathname = '/search';
  router.asPath = '/search?q=star';
  router.query = { q: 'star' };
};

beforeEach(resetRouter);

afterEach(() => {
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});

describe('useSearchReturnTo precedence', () => {
  test('referrer wins over everything', async () => {
    setSessionItem(KEY, '/search?q=session');
    const { result } = renderHook(() =>
      useSearchReturnTo({ referrer: '/library/123', reconstructed: '/search?q=recon' }),
    );
    await waitFor(() => expect(result.current.returnTo).toBe('/library/123'));
  });

  test('captured session URL wins over reconstructed by default', async () => {
    setSessionItem(KEY, '/search?q=session');
    const { result } = renderHook(() => useSearchReturnTo({ reconstructed: '/search?q=recon' }));
    await waitFor(() => expect(result.current.returnTo).toBe('/search?q=session'));
  });

  test('reconstructed wins over session when preferReconstructed is set (viz pages)', async () => {
    setSessionItem(KEY, '/search?q=session');
    const { result } = renderHook(() =>
      useSearchReturnTo({ reconstructed: '/search?q=recon', preferReconstructed: true }),
    );
    await waitFor(() => expect(result.current.returnTo).toBe('/search?q=recon'));
  });

  test('falls back to reconstructed when no session URL exists', async () => {
    const { result } = renderHook(() => useSearchReturnTo({ reconstructed: '/search?q=recon' }));
    await waitFor(() => expect(result.current.returnTo).toBe('/search?q=recon'));
  });

  test('returns null when there is no target at all', async () => {
    const { result } = renderHook(() => useSearchReturnTo());
    await waitFor(() => expect(result.current.returnTo).toBeNull());
    expect(result.current.returnTo).toBeNull();
  });

  test('hides on first render instead of flashing reconstructed before the session read', () => {
    setSessionItem(KEY, '/search?q=session');
    const renders: Array<string | null> = [];
    renderHook(() => {
      const { returnTo } = useSearchReturnTo({ reconstructed: '/search?q=recon' });
      renders.push(returnTo);
      return returnTo;
    });
    // Without the readiness gate this would render '/search?q=recon' first, then
    // flip to the session URL after mount. The first render must be null.
    expect(renders[0]).toBeNull();
  });

  test('renders reconstructed immediately for viz pages without waiting on the session read', () => {
    setSessionItem(KEY, '/search?q=session');
    const renders: Array<string | null> = [];
    renderHook(() => {
      const { returnTo } = useSearchReturnTo({ reconstructed: '/search?q=recon', preferReconstructed: true });
      renders.push(returnTo);
      return returnTo;
    });
    // preferReconstructed outranks session and is known synchronously, so no pop-in.
    expect(renders[0]).toBe('/search?q=recon');
  });

  test('prefers session over an empty reconstructed when preferReconstructed is set', async () => {
    setSessionItem(KEY, '/search?q=session');
    const { result } = renderHook(() => useSearchReturnTo({ reconstructed: null, preferReconstructed: true }));
    await waitFor(() => expect(result.current.returnTo).toBe('/search?q=session'));
  });
});

describe('captureSearchReturnUrl', () => {
  test('writes and clears the captured URL', () => {
    captureSearchReturnUrl('/search?q=star');
    expect(getSessionItem<string>(KEY)).toBe('/search?q=star');
    clearSearchReturnUrl();
    expect(getSessionItem<string>(KEY)).toBeNull();
  });
});

describe('useCaptureSearchReturnUrl', () => {
  test('captures the results URL once the route is ready', async () => {
    renderHook(() => useCaptureSearchReturnUrl());
    await waitFor(() => expect(getSessionItem<string>(KEY)).toBe('/search?q=star'));
  });

  test('does not capture before the route is ready', async () => {
    router.isReady = false;
    renderHook(() => useCaptureSearchReturnUrl());
    await Promise.resolve();
    expect(getSessionItem<string>(KEY)).toBeNull();
  });

  test('does not capture on non-results pathnames', async () => {
    router.pathname = '/abs/[id]/citations';
    router.asPath = '/abs/2024xyz/citations';
    renderHook(() => useCaptureSearchReturnUrl());
    await Promise.resolve();
    expect(getSessionItem<string>(KEY)).toBeNull();
  });

  test('does not capture a results view that has no query', async () => {
    router.asPath = '/search';
    router.query = {};
    renderHook(() => useCaptureSearchReturnUrl());
    await Promise.resolve();
    expect(getSessionItem<string>(KEY)).toBeNull();
  });
});
