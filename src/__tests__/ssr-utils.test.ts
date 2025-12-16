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

const getMockContext = (sessionData: Partial<IronSession>, query: ParsedUrlQuery = {}, resolvedUrl = '/search') =>
  ({
    req: {
      session: {
        ...sessionData,
        save: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn().mockResolvedValue(undefined),
      },
    },
    query,
    resolvedUrl,
  } as unknown as GetServerSidePropsContext);

describe('updateUserStateSSR', () => {
  test('should set adsMode and mode for legacy referrer with no persisted state', async () => {
    const context = getMockContext({ legacyAppReferrer: true });
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
    const context = getMockContext({ legacyAppReferrer: true });
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
    const context = getMockContext({ legacyAppReferrer: true }, { d: 'heliophysics' });
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

  test('should clear legacyAppReferrer flag when applying legacy mode', async () => {
    const mockSession = {
      legacyAppReferrer: true,
      save: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn().mockResolvedValue(undefined),
    };
    const context = getMockContext(mockSession);

    await updateUserStateSSR(context, { props: {} });

    expect(context.req.session.legacyAppReferrer).toBe(false);
    expect(context.req.session.save).toHaveBeenCalledOnce();
  });

  test('should clear legacyAppReferrer flag even with persisted state (migration)', async () => {
    const mockSession = {
      legacyAppReferrer: true,
      save: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn().mockResolvedValue(undefined),
    };
    const context = getMockContext(mockSession);
    const inputProps = {
      props: {
        dehydratedAppState: {
          adsMode: { active: false },
          mode: AppMode.GENERAL,
        } as Partial<AppState>,
      },
    };

    await updateUserStateSSR(context, inputProps as never);

    expect(context.req.session.legacyAppReferrer).toBe(false);
    expect(context.req.session.save).toHaveBeenCalledOnce();
    expect(inputProps.props.dehydratedAppState.adsMode).toEqual({ active: false });
    expect(inputProps.props.dehydratedAppState.mode).toBe(AppMode.GENERAL);
  });

  test('should not save session when legacyAppReferrer is not set', async () => {
    const mockSession = {
      legacyAppReferrer: false,
      save: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn().mockResolvedValue(undefined),
    };
    const context = getMockContext(mockSession);

    await updateUserStateSSR(context, { props: {} });

    expect(context.req.session.save).not.toHaveBeenCalled();
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
