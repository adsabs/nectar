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
  cookie?: string,
) =>
  ({
    req: {
      session: {
        ...sessionData,
        save: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn().mockResolvedValue(undefined),
      },
      headers: { referer, cookie },
    },
    query,
    resolvedUrl,
  } as unknown as GetServerSidePropsContext);

describe('updateUserStateSSR', () => {
  test('should set mode for legacy referrer with no persisted state', async () => {
    // Mode is now set by middleware writing the scix_prefs cookie before redirect.
    // updateUserStateSSR no longer reads the referer header to infer mode.
    const context = getMockContext({}, {}, '/search', 'https://ui.adsabs.harvard.edu/search');
    const result = await updateUserStateSSR(context, { props: {} });

    if (!('props' in result)) {
      throw new Error('Expected props in result');
    }
    const props = result.props as SSRPropsWithState;
    expect(props.dehydratedAppState).not.toHaveProperty('mode');
  });

  test('should respect persisted state even with legacy referrer', async () => {
    // Cookie-based mode takes precedence; referer header is ignored.
    const prefs = { mode: 'EARTH_SCIENCE' };
    const cookie = `scix_prefs=${encodeURIComponent(JSON.stringify(prefs))}`;
    const context = getMockContext({}, {}, '/search', 'https://ui.adsabs.harvard.edu/search', cookie);
    const result = await updateUserStateSSR(context, { props: {} });

    if (!('props' in result)) {
      throw new Error('Expected props in result');
    }
    const resultProps = result.props as SSRPropsWithState;
    expect(resultProps.dehydratedAppState).toEqual(
      expect.objectContaining({
        mode: AppMode.EARTH_SCIENCE,
      }),
    );
  });

  test('should not add mode without legacy referrer or URL param', async () => {
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

  describe('forceMode handling', () => {
    test('should apply forceMode on home page', async () => {
      const context = getMockContext({}, { forceMode: 'planetary' }, '/');
      const result = await updateUserStateSSR(context, { props: {} });

      if (!('props' in result)) {
        throw new Error('Expected props in result');
      }
      const props = result.props as SSRPropsWithState;
      expect(props.dehydratedAppState).toEqual(
        expect.objectContaining({
          mode: AppMode.PLANET_SCIENCE,
        }),
      );
    });

    test('should prioritize forceMode over d param on /search', async () => {
      const context = getMockContext({}, { forceMode: 'earth', d: 'heliophysics' }, '/search');
      const result = await updateUserStateSSR(context, { props: {} });

      if (!('props' in result)) {
        throw new Error('Expected props in result');
      }
      const props = result.props as SSRPropsWithState;
      expect(props.dehydratedAppState).toEqual(
        expect.objectContaining({
          mode: AppMode.EARTH_SCIENCE,
        }),
      );
    });

    test('should prioritize forceMode over legacy referrer', async () => {
      const context = getMockContext(
        {},
        { forceMode: 'biophysical' },
        '/search',
        'https://ui.adsabs.harvard.edu/search',
      );
      const result = await updateUserStateSSR(context, { props: {} });

      if (!('props' in result)) {
        throw new Error('Expected props in result');
      }
      const props = result.props as SSRPropsWithState;
      expect(props.dehydratedAppState).toEqual(
        expect.objectContaining({
          mode: AppMode.BIO_PHYSICAL,
        }),
      );
    });

    test('should handle invalid forceMode gracefully', async () => {
      const context = getMockContext({}, { forceMode: 'invalid' }, '/');
      const result = await updateUserStateSSR(context, { props: {} });

      if (!('props' in result)) {
        throw new Error('Expected props in result');
      }
      const props = result.props as SSRPropsWithState;
      expect(props.dehydratedAppState).not.toHaveProperty('mode');
    });
  });

  test('seeds mode from scix_prefs cookie when no URL param', async () => {
    const prefs = { mode: 'ASTROPHYSICS' };
    const cookie = `scix_prefs=${encodeURIComponent(JSON.stringify(prefs))}`;
    const context = getMockContext({}, {}, '/search', undefined, cookie);
    const result = await updateUserStateSSR(context, { props: {} });
    if (!('props' in result)) {
      throw new Error('Expected props');
    }
    const props = result.props as SSRPropsWithState;
    expect(props.dehydratedAppState).toEqual(expect.objectContaining({ mode: AppMode.ASTROPHYSICS }));
  });

  test('seeds searchMode from scix_prefs cookie', async () => {
    const prefs = { searchMode: 'ADS_COMPAT', mode: 'ASTROPHYSICS' };
    const cookie = `scix_prefs=${encodeURIComponent(JSON.stringify(prefs))}`;
    const context = getMockContext({}, {}, '/', undefined, cookie);
    const result = await updateUserStateSSR(context, { props: {} });
    if (!('props' in result)) {
      throw new Error('Expected props');
    }
    const props = result.props as SSRPropsWithState;
    expect(props.dehydratedAppState).toEqual(expect.objectContaining({ searchMode: 'ADS_COMPAT' }));
  });

  test('URL forceMode takes priority over prefs cookie mode', async () => {
    const prefs = { mode: 'ASTROPHYSICS' };
    const cookie = `scix_prefs=${encodeURIComponent(JSON.stringify(prefs))}`;
    const context = getMockContext({}, { forceMode: 'heliophysics' }, '/', undefined, cookie);
    const result = await updateUserStateSSR(context, { props: {} });
    if (!('props' in result)) {
      throw new Error('Expected props');
    }
    const props = result.props as SSRPropsWithState;
    expect(props.dehydratedAppState).toEqual(expect.objectContaining({ mode: AppMode.HELIOPHYSICS }));
  });

  test('legacy referrer no longer sets mode in GSSP (handled by middleware+cookie)', async () => {
    const context = getMockContext({}, {}, '/search', 'https://ui.adsabs.harvard.edu/search');
    const result = await updateUserStateSSR(context, { props: {} });
    if (!('props' in result)) {
      throw new Error('Expected props');
    }
    const props = result.props as SSRPropsWithState;
    expect(props.dehydratedAppState).not.toHaveProperty('mode');
  });

  test('rejects invalid mode value from prefs cookie', async () => {
    const prefs = { mode: 'GARBAGE_MODE' };
    const cookie = `scix_prefs=${encodeURIComponent(JSON.stringify(prefs))}`;
    const context = getMockContext({}, {}, '/search', undefined, cookie);
    const result = await updateUserStateSSR(context, { props: {} });
    if (!('props' in result)) {
      throw new Error('Expected props');
    }
    const props = result.props as SSRPropsWithState;
    expect(props.dehydratedAppState).not.toHaveProperty('mode');
  });

  test('rejects invalid searchMode value from prefs cookie', async () => {
    const prefs = { searchMode: 'INVALID_SEARCH_MODE' };
    const cookie = `scix_prefs=${encodeURIComponent(JSON.stringify(prefs))}`;
    const context = getMockContext({}, {}, '/', undefined, cookie);
    const result = await updateUserStateSSR(context, { props: {} });
    if (!('props' in result)) {
      throw new Error('Expected props');
    }
    const props = result.props as SSRPropsWithState;
    expect(props.dehydratedAppState).not.toHaveProperty('searchMode');
  });
});
