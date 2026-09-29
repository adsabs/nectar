import { render, waitFor } from '@/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getNotification } from '@/store/slices';
import { Notification } from './Notification';

const router = { events: { on: vi.fn(), off: vi.fn() } };

vi.mock('next/router', () => ({
  useRouter: () => router,
}));

const setUrl = (url: string) => window.history.replaceState(null, '', url);

beforeEach(() => {
  setUrl('/search?q=star');
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Notification', () => {
  test('strips the consumed notify param from the URL', async () => {
    setUrl('/search?q=star&notify=account-logout-success');
    render(<Notification />, { initialStore: { notification: getNotification('account-logout-success') } });

    await waitFor(() => expect(window.location.search).toBe('?q=star'));
  });

  test('leaves the rest of the URL intact', async () => {
    setUrl('/search?q=star&notify=account-logout-success&sort=date#results');
    render(<Notification />, { initialStore: { notification: getNotification('account-logout-success') } });

    await waitFor(() => expect(window.location.search).toBe('?q=star&sort=date'));
    expect(window.location.pathname).toBe('/search');
    expect(window.location.hash).toBe('#results');
  });

  test('leaves a URL without a notify param alone', async () => {
    render(<Notification />, { initialStore: { notification: getNotification('account-logout-success') } });

    await waitFor(() => expect(window.location.search).toBe('?q=star'));
  });
});
