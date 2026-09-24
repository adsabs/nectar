import { describe, expect, test, vi } from 'vitest';
import { GetServerSidePropsContext } from 'next';

import { composeNextGSSP } from '@/ssr-utils';

vi.mock('iron-session/next', () => ({
  withIronSessionSsr: (handler: unknown) => handler,
}));

vi.mock('@sentry/nextjs', async (orig) => {
  const actual = await orig<typeof import('@sentry/nextjs')>();
  return { ...actual, getIsolationScope: () => ({ setTag: vi.fn() }) };
});

const getMockContext = () => {
  const setHeader = vi.fn();
  const ctx = {
    req: { session: {}, headers: {} },
    res: { setHeader },
    query: {},
    resolvedUrl: '/search',
  } as unknown as GetServerSidePropsContext;
  return { ctx, setHeader };
};

describe('composeNextGSSP', () => {
  test('marks session-bearing responses as uncacheable', async () => {
    const { ctx, setHeader } = getMockContext();

    await composeNextGSSP(() => Promise.resolve({ props: {} }))(ctx);

    expect(setHeader).toHaveBeenCalledWith('Cache-Control', 'private, no-store');
  });

  test('never emits a shared-cache freshness directive', async () => {
    const { ctx, setHeader } = getMockContext();

    await composeNextGSSP(() => Promise.resolve({ props: {} }))(ctx);

    const values = setHeader.mock.calls.filter(([name]) => name === 'Cache-Control').map(([, value]) => String(value));
    expect(values).not.toHaveLength(0);
    for (const value of values) {
      expect(value).not.toMatch(/s-max-?age/);
    }
  });
});
