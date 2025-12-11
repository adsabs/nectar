import { describe, test, expect, vi } from 'vitest';
import { GetServerSidePropsContext } from 'next';
import { IronSession } from 'iron-session';
import { ParsedUrlQuery } from 'querystring';

import { AppMode } from '@/types';
import { updateUserStateSSR } from '@/ssr-utils';

const getMockContext = (sessionData: Partial<IronSession>, query: ParsedUrlQuery = {}) =>
  ({
    req: {
      session: {
        ...sessionData,
        save: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn().mockResolvedValue(undefined),
      },
    },
    query,
  } as unknown as GetServerSidePropsContext);

describe('updateUserStateSSR', () => {
  test('should set adsMode and mode for legacy referrer with no persisted state', async () => {
    const context = getMockContext({ legacyAppReferrer: true });
    const result = await updateUserStateSSR(context, { props: {} });

    expect(result.props.dehydratedAppState).toEqual(
      expect.objectContaining({
        adsMode: { active: true },
        mode: AppMode.ASTROPHYSICS,
      }),
    );
  });

  test('should respect persisted state even with legacy referrer', async () => {
    const context = getMockContext({ legacyAppReferrer: true });
    const props = {
      props: {
        dehydratedAppState: {
          adsMode: { active: false },
          mode: AppMode.GENERAL,
        },
      },
    };
    const result = await updateUserStateSSR(context, props);

    expect(result.props.dehydratedAppState).toEqual(
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
    const props = {
      props: {
        dehydratedAppState: { ...initialAppState },
      },
    };
    const result = await updateUserStateSSR(context, props);
    expect(result.props.dehydratedAppState).not.toHaveProperty('adsMode');
    expect(result.props.dehydratedAppState).not.toHaveProperty('mode');
    expect(result.props.dehydratedAppState.user).toEqual({});
  });

  test('should prioritize URL param over legacy referrer mode', async () => {
    const context = getMockContext({ legacyAppReferrer: true }, { d: 'heliophysics' });
    const result = await updateUserStateSSR(context, { props: {} });

    expect(result.props.dehydratedAppState).toEqual(
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
    const props = {
      props: {
        dehydratedAppState: {
          adsMode: { active: false },
          mode: AppMode.GENERAL,
        },
      },
    };

    await updateUserStateSSR(context, props);

    expect(context.req.session.legacyAppReferrer).toBe(false);
    expect(context.req.session.save).toHaveBeenCalledOnce();
    expect(props.props.dehydratedAppState.adsMode).toEqual({ active: false });
    expect(props.props.dehydratedAppState.mode).toBe(AppMode.GENERAL);
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
});
