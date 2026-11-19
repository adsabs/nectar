import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { AppMode } from '@/types';
import { useSentryDisciplineTag } from './useSentryDisciplineTag';

const setTag = vi.fn();
vi.mock('@sentry/nextjs', () => ({
  setTag: (...args: unknown[]) => setTag(...args),
}));

const loggerError = vi.fn();
vi.mock('@/logger', () => ({
  logger: { error: (...args: unknown[]) => loggerError(...args) },
}));

let mode: AppMode = AppMode.GENERAL;
vi.mock('@/store', () => ({
  useStore: (selector: (state: { mode: AppMode }) => unknown) => selector({ mode }),
}));

afterEach(() => {
  setTag.mockReset();
  loggerError.mockReset();
  mode = AppMode.GENERAL;
});

describe('useSentryDisciplineTag', () => {
  test('tags the current discipline on mount', () => {
    mode = AppMode.ASTROPHYSICS;
    renderHook(() => useSentryDisciplineTag());

    expect(setTag).toHaveBeenCalledWith('discipline', AppMode.ASTROPHYSICS);
  });

  test('retags when the discipline changes', () => {
    mode = AppMode.GENERAL;
    const { rerender } = renderHook(() => useSentryDisciplineTag());
    expect(setTag).toHaveBeenCalledWith('discipline', AppMode.GENERAL);

    mode = AppMode.HELIOPHYSICS;
    rerender();

    expect(setTag).toHaveBeenLastCalledWith('discipline', AppMode.HELIOPHYSICS);
  });

  test('tags the default discipline rather than leaving the dimension unset', () => {
    renderHook(() => useSentryDisciplineTag());

    expect(setTag).toHaveBeenCalledTimes(1);
    expect(setTag).toHaveBeenCalledWith('discipline', AppMode.GENERAL);
  });

  test('a throwing setTag is logged rather than taking down the render', () => {
    setTag.mockImplementation(() => {
      throw new Error('sentry not initialised');
    });

    expect(() => renderHook(() => useSentryDisciplineTag())).not.toThrow();
    expect(loggerError).toHaveBeenCalledTimes(1);
  });
});
