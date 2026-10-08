import { act, render, waitFor } from '@/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getNotification } from '@/store/slices';
import { useStore } from '@/store';
import { Notification } from './Notification';

const NotificationProbe = () => {
  const notification = useStore((state) => state.notification);
  return <div data-testid="probe">{notification?.id ?? 'none'}</div>;
};

const withProbe = (
  <>
    <Notification />
    <NotificationProbe />
  </>
);

const navigateListeners: Array<() => void> = [];

const router = {
  events: { on: vi.fn(), off: vi.fn() },
  onNavigateStart: (cb: () => void): (() => void) => {
    navigateListeners.push(cb);
    return () => {
      const index = navigateListeners.indexOf(cb);
      if (index >= 0) {
        navigateListeners.splice(index, 1);
      }
    };
  },
  onNavigateComplete: (): (() => void) => () => undefined,
};

// App router reports a replaceState-only change as a navigation too.
const emitNavigateStart = () => {
  [...navigateListeners].forEach((cb) => cb());
};

vi.mock('next/router', () => ({
  useRouter: () => router,
}));

vi.mock('@/lib/useRouterCompat', () => ({
  useRouterCompat: () => router,
}));

const setUrl = (url: string) => window.history.replaceState(null, '', url);

beforeEach(() => {
  setUrl('/search?q=star');
  navigateListeners.length = 0;
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

  // Treating the component's own strip as a route change would tear the
  // notification down within a tick of raising it.
  test('survives the navigation its own param strip produces', async () => {
    setUrl('/search?q=star&notify=account-logout-success');
    const { getByTestId } = render(withProbe, {
      initialStore: { notification: getNotification('account-logout-success') },
    });

    await waitFor(() => expect(window.location.search).toBe('?q=star'));

    act(() => emitNavigateStart());

    expect(getByTestId('probe')).toHaveTextContent('account-logout-success');
  });

  test('still clears on a navigation it did not cause', async () => {
    const { getByTestId } = render(withProbe, {
      initialStore: { notification: getNotification('account-logout-success') },
    });

    expect(getByTestId('probe')).toHaveTextContent('account-logout-success');

    setUrl('/abs/2024AAA...1....1X/abstract');
    act(() => emitNavigateStart());

    await waitFor(() => expect(getByTestId('probe')).toHaveTextContent('none'));
  });
});

// App router: replaceState itself fires a navigation immediately, with
// window.location already showing the stripped URL — must not clear.
// Pages router: replaceState fires no event; the next real navigation's
// beforeHistoryChange still shows the stripped URL (pre-swap) — must clear.
// URL alone can't tell these apart, so the guard needs timing too.
describe('Notification self-strip guard across router orderings', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('survives the app router reporting its own strip immediately', async () => {
    setUrl('/search?q=star&notify=account-logout-success');
    const { getByTestId } = render(withProbe, {
      initialStore: { notification: getNotification('account-logout-success') },
    });

    await waitFor(() => expect(window.location.search).toBe('?q=star'));
    act(() => emitNavigateStart());

    expect(getByTestId('probe')).toHaveTextContent('account-logout-success');
  });

  test('clears on a later pages-router navigation despite the url still matching', async () => {
    setUrl('/?notify=account-logout-success');
    const { getByTestId } = render(withProbe, {
      initialStore: { notification: getNotification('account-logout-success') },
    });

    await waitFor(() => expect(window.location.search).toBe(''));

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    act(() => emitNavigateStart());

    await waitFor(() => expect(getByTestId('probe')).toHaveTextContent('none'));
  });

  test('does not stay armed for a second navigation', async () => {
    setUrl('/search?q=star&notify=account-logout-success');
    const { getByTestId } = render(withProbe, {
      initialStore: { notification: getNotification('account-logout-success') },
    });

    await waitFor(() => expect(window.location.search).toBe('?q=star'));
    act(() => emitNavigateStart());
    expect(getByTestId('probe')).toHaveTextContent('account-logout-success');

    act(() => emitNavigateStart());

    await waitFor(() => expect(getByTestId('probe')).toHaveTextContent('none'));
  });
});
