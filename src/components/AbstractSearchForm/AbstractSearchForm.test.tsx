import { render, waitFor } from '@/test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { SessionStorageKey, setSessionItem } from '@/lib/session/sessionStore';
import { AbstractSearchForm } from './AbstractSearchForm';

const mocks = vi.hoisted(() => ({
  useRouter: vi.fn(() => ({
    query: {} as Record<string, string | string[] | undefined>,
    push: vi.fn(),
    events: { on: vi.fn(), off: vi.fn() },
  })),
}));

vi.mock('next/router', () => ({
  __esModule: true,
  default: { push: vi.fn() },
  useRouter: mocks.useRouter,
}));

afterEach(() => {
  window.sessionStorage.clear();
  mocks.useRouter.mockReturnValue({
    query: {},
    push: vi.fn(),
    events: { on: vi.fn(), off: vi.fn() },
  });
});

describe('AbstractSearchForm back link', () => {
  test('reads a library referrer from the URL and shows "Back to library"', async () => {
    mocks.useRouter.mockReturnValue({
      query: { referrer: '/user/libraries/abc' },
      push: vi.fn(),
      events: { on: vi.fn(), off: vi.fn() },
    });

    const { getByTestId } = render(<AbstractSearchForm />);

    await waitFor(() => {
      const link = getByTestId('back-to-results');
      expect(link).toHaveAttribute('href', '/user/libraries/abc');
      expect(link).toHaveTextContent('Back to library');
    });
  });

  test('falls back to "Back to results" when there is no referrer', async () => {
    setSessionItem(SessionStorageKey.SearchReturnUrl, '/search?q=star');

    const { getByTestId } = render(<AbstractSearchForm />);

    await waitFor(() => {
      const link = getByTestId('back-to-results');
      expect(link).toHaveAttribute('href', '/search?q=star');
      expect(link).toHaveTextContent('Back to results');
    });
  });

  test('rejects a non-library/external referrer value', async () => {
    setSessionItem(SessionStorageKey.SearchReturnUrl, '/search?q=star');
    mocks.useRouter.mockReturnValue({
      query: { referrer: 'https://evil.example.com' },
      push: vi.fn(),
      events: { on: vi.fn(), off: vi.fn() },
    });

    const { getByTestId } = render(<AbstractSearchForm />);

    await waitFor(() => {
      const link = getByTestId('back-to-results');
      expect(link).toHaveAttribute('href', '/search?q=star');
      expect(link).toHaveTextContent('Back to results');
    });
  });
});
