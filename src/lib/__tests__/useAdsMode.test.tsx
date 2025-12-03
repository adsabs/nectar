import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StoreProvider, createStore } from '@/store';
import { useAdsMode } from '../useAdsMode';
import { AppMode } from '@/types';
import { vi } from 'vitest';

vi.mock('next/router', () => ({
  useRouter: () => ({
    isReady: true,
    pathname: '/test',
    query: {},
    replace: vi.fn().mockResolvedValue(true),
  }),
}));

const setupStore = (initialState = {}) => {
  const store = createStore(initialState);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <StoreProvider createStore={() => store}>{children}</StoreProvider>
  );
  return { store, wrapper };
};

describe('useAdsMode', () => {
  it('enabling ADS mode forces AppMode to Astrophysics and dismisses notice', () => {
    const { store, wrapper } = setupStore({
      mode: AppMode.GENERAL,
      adsMode: { active: false },
      modeNoticeVisible: true,
    });
    const { result } = renderHook(() => useAdsMode(), { wrapper });

    act(() => {
      result.current.enable('test');
    });

    const state = store.getState();
    expect(state.adsMode.active).toBe(true);
    expect(state.mode).toBe(AppMode.ASTROPHYSICS);
    expect(state.modeNoticeVisible).toBe(false);
    expect(state.urlModePrevious).toBe(AppMode.GENERAL);
  });

  it('disabling ADS mode keeps AppMode as-is (intentional asymmetry)', () => {
    const { store, wrapper } = setupStore({
      mode: AppMode.ASTROPHYSICS,
      adsMode: { active: true },
      modeNoticeVisible: true,
    });
    const { result } = renderHook(() => useAdsMode(), { wrapper });

    act(() => {
      result.current.disable('test');
    });

    const state = store.getState();
    expect(state.adsMode.active).toBe(false);
    expect(state.mode).toBe(AppMode.ASTROPHYSICS);
    expect(state.modeNoticeVisible).toBe(true);
  });

  it('enabling ADS mode does not override an active URL mode override', () => {
    const { store, wrapper } = setupStore({
      mode: AppMode.HELIOPHYSICS,
      adsMode: { active: false },
      urlModeOverride: AppMode.HELIOPHYSICS,
      modeNoticeVisible: true,
    });
    const { result } = renderHook(() => useAdsMode(), { wrapper });

    act(() => {
      result.current.enable('test');
    });

    const state = store.getState();
    expect(state.adsMode.active).toBe(true);
    expect(state.mode).toBe(AppMode.HELIOPHYSICS);
    expect(state.modeNoticeVisible).toBe(true);
  });
});
