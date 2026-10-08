import { ChakraProvider } from '@chakra-ui/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { render, waitFor } from '@/test-utils';
import { hashSiteMsg, readDismissedMsgHash, readPrefsCookie } from '@/utils/common/prefs-cookie';
import { SiteAlert } from './SiteAlert';

const MESSAGE = 'Starting November 1st, all ADS users will be redirected.';

const mocks = vi.hoisted(() => ({
  siteWideMsg: { current: undefined as string | undefined },
  isAuthenticated: { current: false },
  settings: {
    current: { last_seen_message: '' } as { last_seen_message: string; preferredSearchSort?: string },
    isFetching: false,
  },
  updateSettings: vi.fn(),
}));

// SSR's query cache starts empty; this mock must not echo initialData back,
// or the server-resolved banner silently blanks.
vi.mock('@/api/vault/vault', () => ({
  useGetSiteWideMsg: () => ({ data: mocks.siteWideMsg.current }),
}));

vi.mock('@/lib/useSession', () => ({
  useSession: () => ({ isAuthenticated: mocks.isAuthenticated.current }),
}));

vi.mock('@/lib/useSettings', () => ({
  useSettings: () => ({
    settings: mocks.settings.current,
    updateSettings: mocks.updateSettings,
    getSettingsState: { isFetching: mocks.settings.isFetching },
  }),
}));

beforeEach(() => {
  mocks.siteWideMsg.current = undefined;
  mocks.isAuthenticated.current = false;
  mocks.settings.current = { last_seen_message: '' };
  mocks.settings.isFetching = false;
  mocks.updateSettings.mockClear();
  localStorage.clear();
});

afterEach(() => {
  document.cookie = 'scix_prefs=; Max-Age=0; Path=/';
});

describe('SiteAlert — server-resolved', () => {
  // Must land in the first-paint HTML, not get inserted after hydration.
  test('is present in the server-rendered markup', () => {
    const html = renderToString(
      <ChakraProvider>
        <SiteAlert initialMessage={MESSAGE} />
      </ChakraProvider>,
    );

    expect(html).toContain(MESSAGE);
  });

  test('renders the alert when the server found an undismissed message', () => {
    const { getByText } = render(<SiteAlert initialMessage={MESSAGE} />);

    expect(getByText(MESSAGE)).toBeInTheDocument();
  });

  // Gating on message presence alone would paint a dismissed banner, then
  // vanish it — one layout shift traded for another.
  test('renders nothing when the server saw a matching dismissal', () => {
    const { queryByRole } = render(<SiteAlert initialMessage={MESSAGE} initialDismissedHash={hashSiteMsg(MESSAGE)} />);

    expect(queryByRole('alert')).toBeNull();
  });

  test('renders the alert when the dismissal is for an older message', () => {
    const { getByText } = render(
      <SiteAlert initialMessage={MESSAGE} initialDismissedHash={hashSiteMsg('an older message')} />,
    );

    expect(getByText(MESSAGE)).toBeInTheDocument();
  });

  test('renders nothing when the server found no message', () => {
    const { queryByRole } = render(<SiteAlert initialMessage={null} />);

    expect(queryByRole('alert')).toBeNull();
  });

  test('dismissal records the hash in the prefs cookie', async () => {
    const { getByRole, user } = render(<SiteAlert initialMessage={MESSAGE} />);

    await user.click(getByRole('button', { name: /close/i }));

    await waitFor(() => expect(readDismissedMsgHash()).toBe(hashSiteMsg(MESSAGE)));
  });

  test('an authenticated dismissal still updates saved settings', async () => {
    mocks.isAuthenticated.current = true;
    const { getByRole, user } = render(<SiteAlert initialMessage={MESSAGE} />);

    await user.click(getByRole('button', { name: /close/i }));

    expect(mocks.updateSettings).toHaveBeenCalledWith({ last_seen_message: MESSAGE });
  });

  // Authenticated dismissals predate the cookie; without this backfill the
  // server has no record and replays the banner every visit.
  test('backfills the cookie when settings already record the dismissal', async () => {
    mocks.isAuthenticated.current = true;
    mocks.settings.current = { last_seen_message: MESSAGE };

    render(<SiteAlert initialMessage={MESSAGE} />);

    await waitFor(() => expect(readDismissedMsgHash()).toBe(hashSiteMsg(MESSAGE)));
  });
});

// Search-preference persistence moved to SettingsSync; see its test file. The
// banner must not be the thing that keeps that cookie current.
describe('SiteAlert — does not own search preferences', () => {
  test('writes no search sort preference of its own', async () => {
    mocks.isAuthenticated.current = true;
    mocks.settings.current = { last_seen_message: '', preferredSearchSort: 'citation_count' };

    render(<SiteAlert initialMessage={null} />);

    await waitFor(() => expect(readPrefsCookie().preferredSearchSort).toBeUndefined());
  });
});

describe('SiteAlert — client-only (Pages Router)', () => {
  test('stays hidden until dismissal state is known', () => {
    mocks.siteWideMsg.current = MESSAGE;
    mocks.isAuthenticated.current = true;
    mocks.settings.isFetching = true;

    const { queryByRole } = render(<SiteAlert />);

    expect(queryByRole('alert')).toBeNull();
  });

  test('shows the message once dismissal state resolves', async () => {
    mocks.siteWideMsg.current = MESSAGE;

    const { findByText } = render(<SiteAlert />);

    expect(await findByText(MESSAGE)).toBeInTheDocument();
  });

  test('respects a localStorage dismissal', async () => {
    mocks.siteWideMsg.current = MESSAGE;
    localStorage.setItem('last-sys-msg', MESSAGE);

    const { queryByRole } = render(<SiteAlert />);

    await waitFor(() => expect(queryByRole('alert')).toBeNull());
  });
});
