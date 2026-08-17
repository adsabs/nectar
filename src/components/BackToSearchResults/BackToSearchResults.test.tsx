import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { SessionStorageKey, setSessionItem } from '@/lib/session/sessionStore';
import { BackToSearchResults } from './BackToSearchResults';

const router = { asPath: '/abs/2024xyz/citations' };

vi.mock('next/router', () => ({
  useRouter: () => router,
}));

beforeEach(() => {
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('BackToSearchResults', () => {
  test('renders nothing when there is no return target', () => {
    const { container } = render(<BackToSearchResults />);
    expect(container).toBeEmptyDOMElement();
  });

  test('renders a link to the captured session URL', async () => {
    setSessionItem(SessionStorageKey.SearchReturnUrl, '/search?q=star');
    render(<BackToSearchResults />);
    await waitFor(() => {
      const link = screen.getByTestId('back-to-results');
      expect(link).toHaveAttribute('href', '/search?q=star');
      expect(link).toHaveTextContent('Back to results');
    });
  });

  test('honors an explicit referrer over the session URL', async () => {
    setSessionItem(SessionStorageKey.SearchReturnUrl, '/search?q=star');
    render(<BackToSearchResults referrer="/user/libraries/abc" />);
    await waitFor(() => {
      expect(screen.getByTestId('back-to-results')).toHaveAttribute('href', '/user/libraries/abc');
    });
  });

  test('labels a library referrer target "Back to library"', async () => {
    render(<BackToSearchResults referrer="/user/libraries/abc" />);
    await waitFor(() => {
      expect(screen.getByTestId('back-to-results')).toHaveTextContent('Back to library');
    });
  });

  test('labels a public library referrer target "Back to library"', async () => {
    render(<BackToSearchResults referrer="/public-libraries/abc" />);
    await waitFor(() => {
      expect(screen.getByTestId('back-to-results')).toHaveTextContent('Back to library');
    });
  });

  test('labels a session-captured search target "Back to results"', async () => {
    setSessionItem(SessionStorageKey.SearchReturnUrl, '/search?q=star');
    render(<BackToSearchResults />);
    await waitFor(() => {
      expect(screen.getByTestId('back-to-results')).toHaveTextContent('Back to results');
    });
  });

  test('supports a custom label', async () => {
    setSessionItem(SessionStorageKey.SearchReturnUrl, '/search?q=star');
    render(<BackToSearchResults label="Go back" />);
    await waitFor(() => expect(screen.getByTestId('back-to-results')).toHaveTextContent('Go back'));
  });

  test('a custom label overrides the derived library label', async () => {
    render(<BackToSearchResults referrer="/user/libraries/abc" label="Go back" />);
    await waitFor(() => expect(screen.getByTestId('back-to-results')).toHaveTextContent('Go back'));
  });
});
