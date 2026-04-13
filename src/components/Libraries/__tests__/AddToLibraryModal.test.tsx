import { render } from '@/test-utils';
import { describe, expect, test, vi } from 'vitest';
import { AddToLibraryModal } from '../AddToLibraryModal';

const mocks = vi.hoisted(() => ({
  useRouter: vi.fn(() => ({
    query: { q: 'star' },
    asPath: '/search?q=star',
    push: vi.fn(),
    events: { on: vi.fn(), off: vi.fn() },
  })),
}));

vi.mock('next/router', () => ({ useRouter: mocks.useRouter }));

describe('AddToLibraryModal', () => {
  const defaultProps = {
    bibcodes: ['2021ApJ...000A...1X'],
    isOpen: true,
    onClose: vi.fn(),
  };

  test('read-only library cannot be selected', async () => {
    const { user, findByRole, findByText } = render(<AddToLibraryModal {...defaultProps} />);

    // Wait for libraries to load — the table should appear
    await findByRole('table');

    // Library "003" from mock data has permission "read" — its name is "003"
    const readOnlyRow = await findByText('003');
    await user.click(readOnlyRow);

    // Submit button should still be disabled because nothing was selected
    const submitButton = await findByRole('button', { name: /submit/i });
    expect(submitButton).toBeDisabled();
  });

  test('read-only library row is visually marked as disabled', async () => {
    const { findByRole, findAllByRole } = render(<AddToLibraryModal {...defaultProps} />);

    await findByRole('table');

    const rows = await findAllByRole('row');
    // Find the row for library "003" (read-only)
    const readOnlyRow = rows.find(
      (row) => row.textContent?.includes('003') && row.getAttribute('aria-disabled') === 'true',
    );
    expect(readOnlyRow).toBeDefined();
  });

  test('writable library can be selected and enables submit', async () => {
    const { user, findByRole, findByText } = render(<AddToLibraryModal {...defaultProps} />);

    await findByRole('table');

    // Library "001" has permission "admin" — should be selectable
    const writableRow = await findByText('001');
    await user.click(writableRow);

    const submitButton = await findByRole('button', { name: /submit/i });
    expect(submitButton).not.toBeDisabled();
  });

  test('does not invoke success callback when adding to a library returns 403', async () => {
    // This tests the mutateAsync fix: Promise.all should reject when API returns 403,
    // so onClose(true) must NOT be called — previously it was called immediately because
    // mutate() returned void (not a Promise), causing Promise.all to resolve right away.
    const { server } = await import('@/mocks/server');
    const { rest } = await import('msw');
    const { ApiTargets } = await import('@/api/models');
    const onClose = vi.fn();

    server.use(
      rest.post(`*${ApiTargets.DOCUMENTS}/:id`, (_req, res, ctx) => {
        return res(ctx.status(403), ctx.json({ error: 'Insufficient permissions' }));
      }),
    );

    const { user, findByRole, findByText, queryByText } = render(
      <AddToLibraryModal bibcodes={['2021ApJ...000A...1X']} isOpen={true} onClose={onClose} />,
    );

    await findByRole('table');

    // Select writable library "001"
    const writableRow = await findByText('001');
    await user.click(writableRow);

    const submitButton = await findByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Allow async mutations to settle
    await new Promise((r) => setTimeout(r, 100));

    // Success callback (onClose(true)) must NOT have been called
    expect(onClose).not.toHaveBeenCalledWith(true);

    // Success banner text must NOT appear anywhere
    expect(queryByText(/paper\(s\) added/i)).not.toBeInTheDocument();
  });
});
