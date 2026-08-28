import { createServerListenerMocks, render } from '@/test-utils';
import { afterEach, describe, expect, test } from 'vitest';
import type { TestContext } from 'vitest';
import { ReactElement } from 'react';
import { useStore } from '@/store';
import { AbstractPreview } from './AbstractPreview';

// jsdom has no layout, so overflow-driven clamping can't be exercised for real.
// Stub the measured heights on the element prototype; the component compares
// scrollHeight (full content) against clientHeight (the clamped box).
const heightDescriptors: Record<'scrollHeight' | 'clientHeight', PropertyDescriptor | undefined> = {
  scrollHeight: undefined,
  clientHeight: undefined,
};

const stubMeasuredHeights = ({ scrollHeight, clientHeight }: { scrollHeight: number; clientHeight: number }) => {
  (['scrollHeight', 'clientHeight'] as const).forEach((prop) => {
    heightDescriptors[prop] = Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop);
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get: () => scrollHeight });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => clientHeight });
};

afterEach(() => {
  (['scrollHeight', 'clientHeight'] as const).forEach((prop) => {
    if (heightDescriptors[prop]) {
      Object.defineProperty(HTMLElement.prototype, prop, heightDescriptors[prop] as PropertyDescriptor);
      heightDescriptors[prop] = undefined;
    }
  });
});

/**
 * Renders an AbstractPreview alongside a button that flips the global
 * `showAbstracts` toggle, so tests can exercise the interplay between the
 * global toggle and the per-item chevron within a single shared store.
 */
const Harness = ({ bibcode }: { bibcode: string }): ReactElement => {
  const toggleShowAbstracts = useStore((state) => state.toggleShowAbstracts);
  return (
    <>
      <button onClick={toggleShowAbstracts}>toggle-global-abstracts</button>
      <AbstractPreview bibcode={bibcode} />
    </>
  );
};

describe('AbstractPreview global toggle', () => {
  test('opens the item abstract when the global toggle turns on and closes it when it turns off', async () => {
    const { user, getByText, getByLabelText, findByLabelText } = render(<Harness bibcode="2020ApJ...900..100A" />);

    expect(getByLabelText('show abstract')).toBeInTheDocument();

    await user.click(getByText('toggle-global-abstracts'));
    expect(await findByLabelText('hide abstract')).toBeInTheDocument();

    await user.click(getByText('toggle-global-abstracts'));
    expect(await findByLabelText('show abstract')).toBeInTheDocument();
  });

  test('per-item chevron overrides the global toggle state', async () => {
    const { user, getByText, findByLabelText } = render(<Harness bibcode="2020ApJ...900..100A" />);

    await user.click(getByText('toggle-global-abstracts'));

    await user.click(await findByLabelText('hide abstract'));
    expect(await findByLabelText('show abstract')).toBeInTheDocument();
  });
});

describe('AbstractPreview bulk-fed abstract', () => {
  test('renders a provided abstract without issuing a per-item request', async ({ server }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);

    const { findByText } = render(
      <AbstractPreview bibcode="2020ApJ...900..100A" abstract="Bulk provided abstract text." />,
      { initialStore: { showAbstracts: true } },
    );

    expect(await findByText(/Bulk provided abstract text\./)).toBeInTheDocument();

    const perItemRequests = onRequest.mock.calls
      .map((call) => call[0].url)
      .filter(
        (url) => url.pathname.endsWith('/search/query') && (url.searchParams.get('q') ?? '').includes('identifier:'),
      );

    expect(perItemRequests).toHaveLength(0);
  });

  test('clamps with a "View full abstract" link when the abstract overflows the preview', async () => {
    stubMeasuredHeights({ scrollHeight: 1000, clientHeight: 384 });

    const { findByRole } = render(<AbstractPreview bibcode="2020ApJ...900..100A" abstract="A very long abstract." />, {
      initialStore: { showAbstracts: true },
    });

    const link = await findByRole('link', { name: /view full abstract/i });
    expect(link).toHaveAttribute('href', '/abs/2020ApJ...900..100A/abstract');
  });

  test('shows the whole abstract with no link when it fits within the preview', async () => {
    stubMeasuredHeights({ scrollHeight: 200, clientHeight: 384 });

    const { findByText, queryByRole } = render(
      <AbstractPreview bibcode="2020ApJ...900..100A" abstract="A short abstract that fits." />,
      { initialStore: { showAbstracts: true } },
    );

    expect(await findByText(/A short abstract that fits\./)).toBeInTheDocument();
    expect(queryByRole('link', { name: /view full abstract/i })).not.toBeInTheDocument();
  });

  test('ignores the global toggle when allowAbstracts is false (non-search lists)', async () => {
    const { findByLabelText, queryByLabelText } = render(
      <AbstractPreview bibcode="2020ApJ...900..100A" allowAbstracts={false} />,
      { initialStore: { showAbstracts: true } },
    );

    expect(await findByLabelText('show abstract')).toBeInTheDocument();
    expect(queryByLabelText('hide abstract')).not.toBeInTheDocument();
  });

  test('shows a loading indicator instead of "No Abstract" while the bulk fetch is in flight', async () => {
    const { findByLabelText, queryByText } = render(
      <AbstractPreview bibcode="2020ApJ...900..100A" isFetchingAbstract />,
      { initialStore: { showAbstracts: true } },
    );

    expect(await findByLabelText('loading abstract')).toBeInTheDocument();
    expect(queryByText('No Abstract')).not.toBeInTheDocument();
  });
});
