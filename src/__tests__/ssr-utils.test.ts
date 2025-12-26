import { describe, expect, test, vi } from 'vitest';
import { GetServerSidePropsContext } from 'next';
import { IronSession } from 'iron-session';
import { ParsedUrlQuery } from 'querystring';

import { AppMode } from '@/types';
import { updateUserStateSSR } from '@/ssr-utils';
import { AppState } from '@/store/types';

type SSRPropsWithState = {
  dehydratedAppState?: Partial<AppState>;
} & Record<string, unknown>;

const getMockContext = (
  sessionData: Partial<IronSession>,
  query: ParsedUrlQuery = {},
  resolvedUrl = '/search',
  referer?: string,
) =>
  ({
    req: {
      session: {
        ...sessionData,
        save: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn().mockResolvedValue(undefined),
      },
      headers: {
        referer,
      },
    },
    query,
    resolvedUrl,
  } as unknown as GetServerSidePropsContext);

describe('updateUserStateSSR', () => {
  test('should set adsMode and mode for legacy referrer with no persisted state', async () => {
    const context = getMockContext({}, {}, '/search', 'https://ui.adsabs.harvard.edu/search');
    const result = await updateUserStateSSR(context, { props: {} });

    if (!('props' in result)) {
      throw new Error('Expected props in result');
    }
    const props = result.props as SSRPropsWithState;
    expect(props.dehydratedAppState).toEqual(
      expect.objectContaining({
        adsMode: { active: true },
        mode: AppMode.ASTROPHYSICS,
      }),
    );
  });

  test('should respect persisted state even with legacy referrer', async () => {
    const context = getMockContext({}, {}, '/search', 'https://ui.adsabs.harvard.edu/search');
    const inputProps = {
      props: {
        dehydratedAppState: {
          adsMode: { active: false },
          mode: AppMode.GENERAL,
        } as Partial<AppState>,
      },
    };
    const result = await updateUserStateSSR(context, inputProps as never);

    if (!('props' in result)) {
      throw new Error('Expected props in result');
    }
    const resultProps = result.props as SSRPropsWithState;
    expect(resultProps.dehydratedAppState).toEqual(
      expect.objectContaining({
        adsMode: { active: false },
        mode: AppMode.GENERAL,
      }),
    );
  });

  test('should not add adsMode or mode without legacy referrer or URL param', async () => {
    const context = getMockContext({});
    const initialAppState = {
      user: { email: 'test@example.com' },
    };
    const inputProps = {
      props: {
        dehydratedAppState: { ...initialAppState } as unknown as Partial<AppState>,
      },
    };
    const result = await updateUserStateSSR(context, inputProps as never);
    if (!('props' in result)) {
      throw new Error('Expected props in result');
    }
    const resultProps = result.props as SSRPropsWithState;
    expect(resultProps.dehydratedAppState).not.toHaveProperty('adsMode');
    expect(resultProps.dehydratedAppState).not.toHaveProperty('mode');
    expect(resultProps.dehydratedAppState?.user).toEqual({});
  });

  test('should prioritize URL param over legacy referrer mode', async () => {
    const context = getMockContext({}, { d: 'heliophysics' }, '/search', 'https://ui.adsabs.harvard.edu/search');
    const result = await updateUserStateSSR(context, { props: {} });

    if (!('props' in result)) {
      throw new Error('Expected props in result');
    }
    const props = result.props as SSRPropsWithState;
    expect(props.dehydratedAppState).toEqual(
      expect.objectContaining({
        adsMode: { active: true },
        mode: AppMode.HELIOPHYSICS,
      }),
    );
  });


  test('should apply d param when on /search page', async () => {
    const context = getMockContext({}, { d: 'heliophysics' }, '/search');
    const result = await updateUserStateSSR(context, { props: {} });

    if (!('props' in result)) {
      throw new Error('Expected props in result');
    }
    const props = result.props as SSRPropsWithState;
    expect(props.dehydratedAppState).toEqual(
      expect.objectContaining({
        mode: AppMode.HELIOPHYSICS,
      }),
    );
  });

  test('should ignore d param when NOT on /search page', async () => {
    const context = getMockContext({}, { d: 'heliophysics' }, '/abs/2026Icar..44416827M/abstract?d=heliophysics');
    const result = await updateUserStateSSR(context, { props: {} });

    if (!('props' in result)) {
      throw new Error('Expected props in result');
    }
    const props = result.props as SSRPropsWithState;
    expect(props.dehydratedAppState).not.toHaveProperty('mode');
  });

  test('should ignore d param on other pages even with query params', async () => {
    const context = getMockContext(
      {},
      { d: 'planetary', some: 'other' },
      '/abs/2026Icar..44416827M/abstract?d=planetary&some=other',
    );
    const result = await updateUserStateSSR(context, { props: {} });

    if (!('props' in result)) {
      throw new Error('Expected props in result');
    }
    const props = result.props as SSRPropsWithState;
    expect(props.dehydratedAppState).not.toHaveProperty('mode');
  });

  test('should handle invalid d param on /search page', async () => {
    const context = getMockContext({}, { d: 'invalid-discipline' }, '/search');
    const result = await updateUserStateSSR(context, { props: {} });

    if (!('props' in result)) {
      throw new Error('Expected props in result');
    }
    const props = result.props as SSRPropsWithState;
    expect(props.dehydratedAppState).not.toHaveProperty('mode');
  });
});
