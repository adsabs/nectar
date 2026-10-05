import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { render, waitFor } from '@/test-utils';
import { readPrefsCookie } from '@/utils/common/prefs-cookie';
import { SettingsSync } from './SettingsSync';

const mocks = vi.hoisted(() => ({
  isAuthenticated: { current: false },
  settings: {
    current: {} as { preferredSearchSort?: string },
    isFetching: false,
  },
}));

vi.mock('@/lib/useSession', () => ({
  useSession: () => ({ isAuthenticated: mocks.isAuthenticated.current }),
}));

vi.mock('@/lib/useSettings', () => ({
  useSettings: () => ({
    settings: mocks.settings.current,
    getSettingsState: { isFetching: mocks.settings.isFetching },
  }),
}));

beforeEach(() => {
  mocks.isAuthenticated.current = false;
  mocks.settings.current = {};
  mocks.settings.isFetching = false;
});

afterEach(() => {
  document.cookie = 'scix_prefs=; Max-Age=0; Path=/';
});

// The server seeds from the prefs cookie, but only the authenticated settings
// record knows the real sort — something on every route has to copy it over.
describe('SettingsSync', () => {
  test('writes the preferred sort once authenticated settings resolve', async () => {
    mocks.isAuthenticated.current = true;
    mocks.settings.current = { preferredSearchSort: 'citation_count' };

    render(<SettingsSync />);

    await waitFor(() => expect(readPrefsCookie().preferredSearchSort).toBe('citation_count'));
  });

  test('tracks a later change to the preference', async () => {
    mocks.isAuthenticated.current = true;
    mocks.settings.current = { preferredSearchSort: 'citation_count' };

    const { rerender } = render(<SettingsSync />);
    await waitFor(() => expect(readPrefsCookie().preferredSearchSort).toBe('citation_count'));

    mocks.settings.current = { preferredSearchSort: 'date' };
    rerender(<SettingsSync />);

    await waitFor(() => expect(readPrefsCookie().preferredSearchSort).toBe('date'));
  });

  test('writes nothing for an anonymous user', async () => {
    mocks.settings.current = { preferredSearchSort: 'citation_count' };

    render(<SettingsSync />);

    await waitFor(() => expect(readPrefsCookie().preferredSearchSort).toBeUndefined());
  });

  test('waits for settings to settle before writing', async () => {
    mocks.isAuthenticated.current = true;
    mocks.settings.isFetching = true;
    mocks.settings.current = { preferredSearchSort: 'citation_count' };

    render(<SettingsSync />);

    await waitFor(() => expect(readPrefsCookie().preferredSearchSort).toBeUndefined());
  });

  test('renders nothing', () => {
    mocks.isAuthenticated.current = true;
    mocks.settings.current = { preferredSearchSort: 'citation_count' };

    const { container } = render(<SettingsSync />);

    expect(container.firstChild).toBeEmptyDOMElement();
  });
});
