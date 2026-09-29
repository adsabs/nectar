import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useSession } from './useSession';

vi.mock('@/api/api', () => ({
  default: { reset: vi.fn(), setUserData: vi.fn() },
}));

vi.mock('axios');

const reset = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/useUser', () => ({
  useUser: () => ({ user: {}, reset }),
}));

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useSession logout', () => {
  const setUrl = (href: string) => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, href, replace: vi.fn() },
    });
  };

  beforeEach(() => {
    setUrl('http://localhost/search?q=star');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('reloads to a URL carrying the logout notification', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { success: true } });
    const { result } = renderHook(() => useSession(), { wrapper });
    result.current.logout();

    await waitFor(() => expect(reset).toHaveBeenCalled());
    await waitFor(() => expect(window.location.replace).toHaveBeenCalled());

    const [target] = vi.mocked(window.location.replace).mock.calls[0];
    const url = new URL(target as string, 'http://localhost');
    expect(url.searchParams.get('notify')).toBe('account-logout-success');
  });

  test('strips a stale login-success notify param instead of replaying it', async () => {
    setUrl('http://localhost/search?q=star&notify=account-login-success');
    vi.mocked(axios.post).mockResolvedValue({ data: { success: true } });
    const { result } = renderHook(() => useSession(), { wrapper });
    result.current.logout();

    await waitFor(() => expect(window.location.replace).toHaveBeenCalled());

    const [target] = vi.mocked(window.location.replace).mock.calls[0];
    const url = new URL(target as string, 'http://localhost');
    expect(url.searchParams.getAll('notify')).toEqual(['account-logout-success']);
  });

  test('reloads with the logout-failure notification when logout fails', async () => {
    setUrl('http://localhost/search?q=star&notify=account-login-success');
    vi.mocked(axios.post).mockRejectedValue(new Error('logout failed'));
    const { result } = renderHook(() => useSession(), { wrapper });
    result.current.logout();

    await waitFor(() => expect(window.location.replace).toHaveBeenCalled());

    const [target] = vi.mocked(window.location.replace).mock.calls[0];
    const url = new URL(target as string, 'http://localhost');
    expect(url.searchParams.getAll('notify')).toEqual(['account-logout-failed']);
  });
});
