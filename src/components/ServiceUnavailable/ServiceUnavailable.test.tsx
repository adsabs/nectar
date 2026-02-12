import { render, screen } from '@/test-utils';
import { describe, expect, test, vi } from 'vitest';
import { ServiceUnavailable } from './ServiceUnavailable';

const mockReload = vi.fn();
const mockBack = vi.fn();

vi.mock('next/router', () => ({
  useRouter: () => ({
    reload: mockReload,
    back: mockBack,
  }),
}));

describe('ServiceUnavailable', () => {
  test('renders heading and description', () => {
    render(<ServiceUnavailable recordId="2023ApJ...123..456A" />);

    expect(screen.getByText('Temporarily Unavailable')).toBeInTheDocument();
    expect(screen.getByText(/having trouble loading record/)).toBeInTheDocument();
    expect(screen.getByText('2023ApJ...123..456A')).toBeInTheDocument();
  });

  test('renders Try Again button that reloads the page', async () => {
    const { user } = render(<ServiceUnavailable recordId="2023ApJ...123..456A" />);

    const button = screen.getByRole('button', { name: /try again/i });
    expect(button).toBeInTheDocument();
    await user.click(button);
    expect(mockReload).toHaveBeenCalled();
  });

  test('renders Go Back button that navigates back', async () => {
    const { user } = render(<ServiceUnavailable recordId="2023ApJ...123..456A" />);

    const button = screen.getByRole('button', { name: /go back/i });
    expect(button).toBeInTheDocument();
    await user.click(button);
    expect(mockBack).toHaveBeenCalled();
  });

  test('displays status code when provided', () => {
    render(<ServiceUnavailable recordId="2023ApJ...123..456A" statusCode={503} />);

    expect(screen.getByText(/503/)).toBeInTheDocument();
  });

  test('does not display status code section when omitted', () => {
    render(<ServiceUnavailable recordId="2023ApJ...123..456A" />);

    expect(screen.queryByText(/error code/i)).not.toBeInTheDocument();
  });

  test('has accessible status role', () => {
    render(<ServiceUnavailable recordId="2023ApJ...123..456A" />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
