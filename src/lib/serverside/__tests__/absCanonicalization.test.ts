import { describe, expect, it, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import type { GetServerSidePropsContext } from 'next';

import { createAbsGetServerSideProps } from '../absCanonicalization';
import { bootstrap } from '../bootstrap';
import { server } from '@/mocks/server';

vi.mock('../bootstrap', () => ({
  bootstrap: vi.fn(),
}));

vi.mock('@/lib/redis', () => ({
  getRedisClient: vi.fn(() => null),
  isRedisAvailable: vi.fn(() => false),
}));

vi.mock('@/ssr-utils', () => ({
  composeNextGSSP:
    (fn: (ctx: GetServerSidePropsContext) => Promise<unknown>) =>
    (ctx: GetServerSidePropsContext): Promise<unknown> =>
      fn(ctx),
}));

const bootstrapMock = vi.mocked(bootstrap);
const fetchMock = vi.fn();

class HeadersPolyfill extends Map<string, string> {
  constructor(init?: Record<string, string>) {
    super();
    if (init) {
      Object.entries(init).forEach(([key, value]) => this.set(key.toLowerCase(), value));
    }
  }
  append(name: string, value: string) {
    this.set(name.toLowerCase(), value);
  }
  get(name: string) {
    return super.get(name.toLowerCase());
  }
}

vi.stubGlobal('Headers', HeadersPolyfill);
vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

const buildCtx = ({ id, resolvedUrl }: { id: string; resolvedUrl: string }): GetServerSidePropsContext => {
  return {
    params: { id },
    req: {
      url: resolvedUrl,
      headers: {},
    } as unknown as GetServerSidePropsContext['req'],
    res: {
      setHeader: vi.fn(),
    } as unknown as GetServerSidePropsContext['res'],
    resolvedUrl,
    query: {},
  } as GetServerSidePropsContext;
};

beforeAll(() => {
  // disable msw for this suite; we stub fetch manually
  server.close();
});

afterAll(() => {
  // restart msw for other suites
  server.listen({ onUnhandledRequest: 'error' });
});

beforeEach(() => {
  fetchMock.mockReset();
  bootstrapMock.mockReset();
  bootstrapMock.mockResolvedValue({
    token: {
      access_token: 'token',
      expires_at: `${Math.floor(Date.now() / 1000) + 3600}`,
      anonymous: false,
      username: 'tester',
    },
  });
  process.env.API_HOST_SERVER = 'https://api.example.com';
});

describe('createAbsGetServerSideProps', () => {
  it('redirects to canonical bibcode with encoding and preserves query', async () => {
    const body = { response: { docs: [{ bibcode: 'canonical&/bib' }] } };
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(body),
    });

    const ctx = buildCtx({
      id: '10.1073/pnas.0504146103',
      resolvedUrl: '/abs/10.1073/pnas.0504146103/abstract?foo=1',
    });

    const gssp = createAbsGetServerSideProps('abstract');
    const result = await gssp(ctx);

    expect(result).toHaveProperty('redirect');
    if ('redirect' in result) {
      expect(result.redirect?.destination).toBe('/abs/canonical%26%2Fbib/abstract?foo=1');
      expect(result.redirect?.statusCode).toBe(302);
    }
  });

  it('redirects for other views', async () => {
    const body = { response: { docs: [{ bibcode: 'BIBCODE' }] } };
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(body),
    });

    const ctx = buildCtx({
      id: 'noncanonical',
      resolvedUrl: '/abs/noncanonical/citations?p=2',
    });

    const gssp = createAbsGetServerSideProps('citations');
    const result = await gssp(ctx);

    expect(result).toHaveProperty('redirect');
    if ('redirect' in result) {
      expect(result.redirect?.destination).toBe('/abs/BIBCODE/citations?p=2');
      expect(result.redirect?.statusCode).toBe(302);
    }
  });

  it('returns props when identifier is already canonical', async () => {
    const bibcode = 'MATCHING';
    const body = { response: { docs: [{ bibcode }] } };
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(body),
    });

    const ctx = buildCtx({
      id: bibcode,
      resolvedUrl: `/abs/${bibcode}/abstract`,
    });

    const gssp = createAbsGetServerSideProps('abstract');
    const result = await gssp(ctx);

    expect(result).toHaveProperty('props');
    if ('props' in result) {
      expect(result.props).toHaveProperty('initialDoc');
    }
    expect((ctx.res as { setHeader: () => void } & Record<string, unknown>).setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      's-maxage=60, stale-while-revalidate=300',
    );
  });

  it('does not redirect when no docs are returned', async () => {
    const body = { response: { docs: [] } };
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(body),
    });

    const ctx = buildCtx({
      id: 'missing',
      resolvedUrl: '/abs/missing/abstract',
    });

    const gssp = createAbsGetServerSideProps('abstract');
    const result = await gssp(ctx);

    expect(result).not.toHaveProperty('redirect');
    expect(result).toHaveProperty('props');
  });
});
