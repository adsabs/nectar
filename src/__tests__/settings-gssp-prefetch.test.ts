import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { GetServerSidePropsContext } from 'next';

import { fetchLibraryLinkServers } from '@/api/vault/vault';
import { fetchUserSettings } from '@/api/user/user';
import { fetchSearch } from '@/api/search/search';
import { getServerSideProps as libraryLinkGSSP } from '@/pages/user/settings/librarylink';
import { getServerSideProps as exportGSSP } from '@/pages/user/settings/export';

vi.mock('iron-session/next', () => ({
  withIronSessionSsr: (handler: unknown) => handler,
}));

vi.mock('@sentry/nextjs', async (orig) => {
  const actual = await orig<typeof import('@sentry/nextjs')>();
  return { ...actual, getIsolationScope: () => ({ setTag: vi.fn() }) };
});

vi.mock('@/api/vault/vault', async (orig) => {
  const actual = await orig<typeof import('@/api/vault/vault')>();
  return { ...actual, fetchLibraryLinkServers: vi.fn() };
});

vi.mock('@/api/user/user', async (orig) => {
  const actual = await orig<typeof import('@/api/user/user')>();
  return { ...actual, fetchUserSettings: vi.fn() };
});

vi.mock('@/api/search/search', async (orig) => {
  const actual = await orig<typeof import('@/api/search/search')>();
  return { ...actual, fetchSearch: vi.fn() };
});

const getMockContext = () =>
  ({
    req: { session: {}, headers: {} },
    res: { setHeader: vi.fn() },
    query: {},
    params: {},
    resolvedUrl: '/user/settings',
  } as unknown as GetServerSidePropsContext);

// Stays pending until release(), catching sequential await of prefetches
const createPendingFetcher = (mock: ReturnType<typeof vi.fn>, value: unknown) => {
  let release: () => void = () => undefined;
  mock.mockImplementation(
    () =>
      new Promise((resolve) => {
        release = () => resolve(value);
      }),
  );
  return () => release();
};

describe('settings pages prefetch independent queries concurrently', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('library link settings starts both prefetches before either resolves', async () => {
    const releaseServers = createPendingFetcher(vi.mocked(fetchLibraryLinkServers), { linkServers: [] });
    const releaseSettings = createPendingFetcher(vi.mocked(fetchUserSettings), {});

    const pending = libraryLinkGSSP(getMockContext());

    await vi.waitFor(() => {
      expect(fetchLibraryLinkServers).toHaveBeenCalled();
      expect(fetchUserSettings).toHaveBeenCalled();
    });

    releaseServers();
    releaseSettings();
    await pending;
  });

  test('export settings starts both prefetches before either resolves', async () => {
    const releaseSearch = createPendingFetcher(vi.mocked(fetchSearch), { response: { docs: [], numFound: 0 } });
    const releaseSettings = createPendingFetcher(vi.mocked(fetchUserSettings), {});

    const pending = exportGSSP(getMockContext());

    await vi.waitFor(() => {
      expect(fetchSearch).toHaveBeenCalled();
      expect(fetchUserSettings).toHaveBeenCalled();
    });

    releaseSearch();
    releaseSettings();
    await pending;
  });
});
