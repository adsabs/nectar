import { render, waitFor } from '@/test-utils';
import { describe, expect, test, vi } from 'vitest';
import { AddToRemoveFromLibraryModal } from '../AddToRemoveFromLibraryModal';

const mocks = vi.hoisted(() => ({
  useRouter: vi.fn(() => ({
    query: { q: 'star' },
    asPath: '/search?q=star',
    push: vi.fn(),
    events: { on: vi.fn(), off: vi.fn() },
  })),
}));

vi.mock('next/router', () => ({ useRouter: mocks.useRouter }));

const FQ_AUTHOR_CLAUSE = '(author_facet_hier:"0\\/Henning, T")';

const filteredLatestQuery = {
  q: 'star',
  fq: ['{!type=aqp v=$fq_author}'],
  fq_author: FQ_AUTHOR_CLAUSE,
  fl: ['bibcode', 'title', 'author'],
  sort: ['date desc'],
  start: 0,
  rows: 10,
};

interface CapturedQueryBody {
  id?: string;
  action?: string;
  params?: Record<string, unknown>;
}

const interceptLibraryQuery = async () => {
  const { server } = await import('@/mocks/server');
  const { rest } = await import('msw');
  const { ApiTargets } = await import('@/api/models');

  const bodies: CapturedQueryBody[] = [];

  server.use(
    rest.post(`*${ApiTargets.LIBRARY_QUERY}/:id`, async (req, res, ctx) => {
      bodies.push((await req.json()) as CapturedQueryBody);
      return res(ctx.status(200), ctx.json({ number_added: 1, bibcodes: ['2021ApJ...000A...1X'] }));
    }),
  );

  return bodies;
};

describe('AddToRemoveFromLibraryModal', () => {
  const defaultProps = {
    bibcodes: ['2021ApJ...000A...1X'],
    isOpen: true,
    onClose: vi.fn(),
  };

  const submitWithNoSelection = async (
    action: 'add' | 'remove',
    initialStore: Record<string, unknown>,
    libraryName = '001',
  ) => {
    const { user, findByRole, findByText } = render(
      <AddToRemoveFromLibraryModal action={action} isOpen onClose={vi.fn()} />,
      { initialStore },
    );

    await findByRole('table');
    await user.click(await findByText(libraryName));
    await user.click(await findByRole('button', { name: /submit/i }));
  };

  test('add all sends the applied filters as resolved fq clauses', async () => {
    const bodies = await interceptLibraryQuery();

    await submitWithNoSelection('add', { latestQuery: filteredLatestQuery });

    await waitFor(() => expect(bodies).toHaveLength(1));

    const [body] = bodies;
    expect(body.params).toEqual({ q: 'star', fq: [FQ_AUTHOR_CLAUSE] });
    expect(JSON.stringify(body)).not.toContain('{!type=aqp');
  });

  test('add all sources the payload from the submitted query, not the search bar', async () => {
    const bodies = await interceptLibraryQuery();

    await submitWithNoSelection('add', {
      latestQuery: { q: 'star' },
      query: { q: 'star AND half-typed' },
    });

    await waitFor(() => expect(bodies).toHaveLength(1));

    expect(bodies[0].params.q).toBe('star');
  });

  test('remove all sends the applied filters as resolved fq clauses', async () => {
    const bodies = await interceptLibraryQuery();

    await submitWithNoSelection('remove', { latestQuery: filteredLatestQuery });

    await waitFor(() => expect(bodies).toHaveLength(1));

    const [body] = bodies;
    expect(body.action).toBe('remove');
    expect(body.params).toEqual({ q: 'star', fq: [FQ_AUTHOR_CLAUSE] });
  });

  test('add all forwards a raw fq clause that has no fq_ companion', async () => {
    const bodies = await interceptLibraryQuery();

    await submitWithNoSelection('add', { latestQuery: { q: 'star', fq: ['(year:2024)'] } });

    await waitFor(() => expect(bodies).toHaveLength(1));

    expect(bodies[0].params).toEqual({ q: 'star', fq: ['(year:2024)'] });
  });

  test('add all sends both resolved and raw clauses, never the aqp header', async () => {
    const bodies = await interceptLibraryQuery();

    await submitWithNoSelection('add', {
      latestQuery: {
        q: 'star',
        fq: ['{!type=aqp v=$fq_author}', '(year:2024)'],
        fq_author: FQ_AUTHOR_CLAUSE,
      },
    });

    await waitFor(() => expect(bodies).toHaveLength(1));

    const [body] = bodies;
    expect(body.params.fq).toEqual(expect.arrayContaining([FQ_AUTHOR_CLAUSE, '(year:2024)']));
    expect(body.params.fq).toHaveLength(2);
    expect(JSON.stringify(body)).not.toContain('{!type=aqp');
  });

  test('add all drops an empty fq_ value instead of sending a blank clause', async () => {
    const bodies = await interceptLibraryQuery();

    await submitWithNoSelection('add', { latestQuery: { q: 'star', fq_author: '' } });

    await waitFor(() => expect(bodies).toHaveLength(1));

    const [body] = bodies;
    expect(body.params).toEqual({ q: 'star' });
    expect(body.params).not.toHaveProperty('fq');
  });

  test('add all on an unfiltered search omits fq entirely', async () => {
    const bodies = await interceptLibraryQuery();

    await submitWithNoSelection('add', { latestQuery: { q: 'star' } });

    await waitFor(() => expect(bodies).toHaveLength(1));

    const [body] = bodies;
    expect(body.params).toEqual({ q: 'star' });
    expect(body.params).not.toHaveProperty('fq');
  });

  test('read-only library cannot be selected', async () => {
    const { user, findByRole, findByText } = render(<AddToRemoveFromLibraryModal {...defaultProps} action="add" />);

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
    const { findByRole, findAllByRole } = render(<AddToRemoveFromLibraryModal action="add" {...defaultProps} />);

    await findByRole('table');

    const rows = await findAllByRole('row');
    // Find the row for library "003" (read-only)
    const readOnlyRow = rows.find(
      (row) => row.textContent?.includes('003') && row.getAttribute('aria-disabled') === 'true',
    );
    expect(readOnlyRow).toBeDefined();
  });

  test('writable library can be selected and enables submit', async () => {
    const { user, findByRole, findByText } = render(<AddToRemoveFromLibraryModal action="add" {...defaultProps} />);

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
      <AddToRemoveFromLibraryModal action="add" bibcodes={['2021ApJ...000A...1X']} isOpen={true} onClose={onClose} />,
    );

    await findByRole('table');

    // Select writable library "001"
    const writableRow = await findByText('001');
    await user.click(writableRow);

    const submitButton = await findByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Wait for the mutation to settle — the button exits its loading state once
    // the 403 response is received and the error handler runs
    await waitFor(() => expect(submitButton).not.toBeDisabled());

    // Success callback (onClose(true)) must NOT have been called
    expect(onClose).not.toHaveBeenCalledWith(true);

    // Success banner text must NOT appear anywhere
    expect(queryByText(/paper\(s\) added/i)).not.toBeInTheDocument();
  });
});
