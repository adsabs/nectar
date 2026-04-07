import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import { DraftBanner } from './DraftBanner';

describe('DraftBanner', () => {
  test('renders nothing when show is false', () => {
    render(<DraftBanner show={false} onRestore={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  test('renders banner with message when show is true', () => {
    render(<DraftBanner show={true} onRestore={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/unsaved draft/i)).toBeInTheDocument();
  });

  test('calls onRestore when Restore button is clicked', async () => {
    const onRestore = vi.fn();
    const { user } = render(<DraftBanner show={true} onRestore={onRestore} onDismiss={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /restore/i }));
    expect(onRestore).toHaveBeenCalledOnce();
  });

  test('calls onDismiss when Dismiss button is clicked', async () => {
    const onDismiss = vi.fn();
    const { user } = render(<DraftBanner show={true} onRestore={vi.fn()} onDismiss={onDismiss} />);
    await user.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
