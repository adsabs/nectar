import { act, render } from '@testing-library/react';
import { useEffect } from 'react';
import { expect, test, vi } from 'vitest';
import type { Store } from '@/store/store';
import type { AppState } from '@/store/types';
import type { IUserData } from '@/api/user/types';

const ssrUser: IUserData = {
  username: 'test@example.com',
  access_token: 'ssr-token',
  anonymous: false,
  expires_at: '9999999999999999',
};

const liveUser: IUserData = {
  username: 'test@example.com',
  access_token: 'live-token',
  anonymous: false,
  expires_at: '9999999999999999',
};

const CHURN_PASSES = 20;

const renderCreateStore = async (incomingState: Partial<AppState>) => {
  vi.resetModules();
  const { useCreateStore } = await import('@/store/store');

  const captured: { store?: Store } = {};
  const Harness = ({ incoming }: { incoming: Partial<AppState> }): null => {
    const createStore = useCreateStore(incoming);
    useEffect(() => {
      captured.store = createStore();
    }, [createStore]);
    return null;
  };

  const { rerender } = render(<Harness incoming={incomingState} />);

  const store = (): Store => {
    if (!captured.store) {
      throw new Error('useCreateStore did not yield a store');
    }
    return captured.store;
  };

  return {
    getState: () => store().getState(),
    setUser: (user: IUserData) => store().setState({ user }),
    navigateTo: (next: Partial<AppState>) => rerender(<Harness incoming={next} />),
    track: () => {
      const userWrites: unknown[] = [];
      const mergeRuns: number[] = [];
      const unsubscribe = store().subscribe((state: AppState, prev: AppState) => {
        if (state.user !== prev.user) {
          userWrites.push(state.user);
        }
        if (state.numPerPage !== prev.numPerPage) {
          mergeRuns.push(state.numPerPage);
        }
      });
      return { userWrites, mergeRuns, unsubscribe };
    },
  };
};

test('seeds the user from incoming state when the store is created', async () => {
  const { getState } = await renderCreateStore({ user: ssrUser });

  expect(getState().user).toEqual(ssrUser);
});

test('does not re-apply the incoming user over a newer store user', async () => {
  const { getState, setUser, navigateTo } = await renderCreateStore({ user: ssrUser });

  await act(async () => {
    setUser(liveUser);
  });
  expect(getState().user).toBe(liveUser);

  await act(async () => {
    navigateTo({ user: { ...ssrUser }, numPerPage: 50 });
  });

  expect(getState().numPerPage).toBe(50);
  expect(getState().user).toBe(liveUser);
});

test('does not re-reference the store user under repeated incoming-state churn', async () => {
  const { getState, navigateTo, track } = await renderCreateStore({ user: ssrUser });
  const { userWrites, mergeRuns, unsubscribe } = track();

  for (let pass = 0; pass < CHURN_PASSES; pass++) {
    await act(async () => {
      navigateTo({ user: { ...ssrUser }, numPerPage: pass % 2 === 0 ? 50 : 25 });
    });
  }
  unsubscribe();

  expect(mergeRuns).toHaveLength(CHURN_PASSES);
  expect(getState().user).toEqual(ssrUser);
  expect(userWrites).toHaveLength(0);
});
