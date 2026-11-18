import { afterEach, describe, expect, test, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { IDocsEntity } from '@/api/search/types';
import { useTrackAbstractView } from './useTrackAbstractView';

const sendGTMEvent = vi.fn();
vi.mock('@next/third-parties/google', () => ({
  sendGTMEvent: (...args: unknown[]) => sendGTMEvent(...args),
}));

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
}));

const doc = (overrides: Partial<IDocsEntity> = {}): IDocsEntity =>
  ({
    bibcode: '2020ApJ...900L..21F',
    title: ['A Galaxy'],
    pub: 'ApJ',
    doctype: 'article',
    database: ['astronomy'],
    ...overrides,
  } as IDocsEntity);

const viewItemCalls = () =>
  sendGTMEvent.mock.calls.map((call) => call[0] as Record<string, unknown>).filter((p) => p.event === 'view_item');

const itemsOf = (payload: Record<string, unknown>) => (payload.ecommerce as { items: Record<string, unknown>[] }).items;

afterEach(() => {
  sendGTMEvent.mockReset();
});

describe('useTrackAbstractView', () => {
  test('a doc in two databases emits one view_item carrying exactly one item', () => {
    renderHook(() => useTrackAbstractView(doc({ database: ['physics', 'astronomy'] })));

    expect(viewItemCalls()).toHaveLength(1);
    expect(itemsOf(viewItemCalls()[0])).toHaveLength(1);
  });

  test('item_category is chosen deterministically as the sorted-first database', () => {
    renderHook(() => useTrackAbstractView(doc({ database: ['physics', 'astronomy', 'general'] })));

    expect(itemsOf(viewItemCalls()[0])[0]).toMatchObject({ item_category: 'astronomy' });
  });

  test('it does not reorder the doc.database array it was given, which lives in the query cache', () => {
    const database = ['physics', 'astronomy', 'general'] as IDocsEntity['database'];
    renderHook(() => useTrackAbstractView(doc({ database })));

    expect(database).toStrictEqual(['physics', 'astronomy', 'general']);
    expect(itemsOf(viewItemCalls()[0])[0]).toMatchObject({ item_category: 'astronomy' });
  });

  test('the item describes the paper', () => {
    renderHook(() => useTrackAbstractView(doc()));

    expect(itemsOf(viewItemCalls()[0])[0]).toStrictEqual({
      item_id: '2020ApJ...900L..21F',
      item_name: 'A Galaxy',
      item_brand: 'ApJ',
      item_category: 'astronomy',
      item_variant: 'article',
      quantity: 1,
    });
  });

  test('navigating to a different abstract emits again, since the page component is reused', () => {
    const { rerender } = renderHook(({ d }: { d: IDocsEntity }) => useTrackAbstractView(d), {
      initialProps: { d: doc({ bibcode: 'A' }) },
    });
    expect(viewItemCalls()).toHaveLength(1);

    rerender({ d: doc({ bibcode: 'B' }) });

    expect(viewItemCalls()).toHaveLength(2);
    expect(itemsOf(viewItemCalls()[1])[0]).toMatchObject({ item_id: 'B' });
  });

  test('a refetch that yields an equal doc with a new identity does not double-emit', () => {
    const { rerender } = renderHook(({ d }: { d: IDocsEntity }) => useTrackAbstractView(d), {
      initialProps: { d: doc({ bibcode: 'A' }) },
    });
    expect(viewItemCalls()).toHaveLength(1);

    rerender({ d: doc({ bibcode: 'A' }) });

    expect(viewItemCalls()).toHaveLength(1);
  });

  test('returning to a previously viewed abstract counts as a new view', () => {
    const { rerender } = renderHook(({ d }: { d: IDocsEntity }) => useTrackAbstractView(d), {
      initialProps: { d: doc({ bibcode: 'A' }) },
    });

    rerender({ d: doc({ bibcode: 'B' }) });
    rerender({ d: doc({ bibcode: 'A' }) });

    expect(viewItemCalls()).toHaveLength(3);
  });

  test('a doc with no database still emits, with no item_category', () => {
    renderHook(() => useTrackAbstractView(doc({ database: [] })));

    expect(viewItemCalls()).toHaveLength(1);
    const item = itemsOf(viewItemCalls()[0])[0];
    expect(item).not.toHaveProperty('item_category');
    expect(item).toMatchObject({ item_id: '2020ApJ...900L..21F' });
  });

  test('a doc with an absent database field still emits', () => {
    renderHook(() => useTrackAbstractView(doc({ database: undefined })));

    expect(viewItemCalls()).toHaveLength(1);
    expect(itemsOf(viewItemCalls()[0])[0]).not.toHaveProperty('item_category');
  });

  test('no doc emits nothing', () => {
    renderHook(() => useTrackAbstractView(undefined));

    expect(viewItemCalls()).toHaveLength(0);
  });

  test('a doc arriving after an undefined render emits once', () => {
    const { rerender } = renderHook(({ d }: { d: IDocsEntity | undefined }) => useTrackAbstractView(d), {
      initialProps: { d: undefined as IDocsEntity | undefined },
    });
    expect(viewItemCalls()).toHaveLength(0);

    rerender({ d: doc({ bibcode: 'A' }) });

    expect(viewItemCalls()).toHaveLength(1);
  });
});
