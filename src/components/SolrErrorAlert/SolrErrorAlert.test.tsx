import { render, screen } from '@/test-utils';
import { describe, expect, test, vi } from 'vitest';
import { SearchErrorAlert } from './SolrErrorAlert';
import { AxiosError, AxiosHeaders } from 'axios';
import { IADSApiSearchResponse } from '@/api/search/types';

vi.mock('next/router', () => ({
  useRouter: () => ({
    reload: vi.fn(),
    back: vi.fn(),
    push: vi.fn(),
    query: {},
    pathname: '/search',
  }),
}));

const makeAxiosError = (msg: string): AxiosError<IADSApiSearchResponse> => {
  const error = new AxiosError<IADSApiSearchResponse>(msg);
  error.response = {
    data: {
      error: { code: 400, msg },
    } as unknown as IADSApiSearchResponse,
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return error;
};

describe('SearchErrorAlert', () => {
  test('renders a "Report this issue" link', () => {
    const error = makeAxiosError('syntax error: cannot parse query');
    render(<SearchErrorAlert error={error} />);

    const link = screen.getByRole('link', { name: /report this issue/i });
    expect(link).toBeInTheDocument();
  });

  test('link href contains /feedback/general and error_details=', () => {
    const msg = 'syntax error: cannot parse query';
    const error = makeAxiosError(msg);
    render(<SearchErrorAlert error={error} />);

    const link = screen.getByRole('link', { name: /report this issue/i });
    expect(link).toHaveAttribute('href');
    const href = link.getAttribute('href');
    expect(href).toContain('/feedback/general');
    const url = new URL(href, 'http://localhost');
    expect(url.searchParams.get('error_details')).toBe(msg);
  });

  test('details section is collapsed by default', () => {
    const error = makeAxiosError('syntax error: cannot parse query');
    render(<SearchErrorAlert error={error} />);

    const toggleBtn = screen.getByLabelText('toggle error details');
    expect(toggleBtn).toHaveTextContent('Show Details');
  });

  test('link always includes from=search param', () => {
    const error = new Error('something failed') as AxiosError<IADSApiSearchResponse>;
    render(<SearchErrorAlert error={error} />);

    const link = screen.getByRole('link', { name: /report this issue/i });
    const href = link.getAttribute('href') ?? '';
    expect(href).toContain('/feedback/general');
    expect(href).toContain('from=search');
  });
});
