import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { track } from './track';
import { exportContract } from './contract';
import { EVENT_NAMES } from './registry';

const sendGTMEvent = vi.fn();
vi.mock('@next/third-parties/google', () => ({
  sendGTMEvent: (...args: unknown[]) => sendGTMEvent(...args),
}));

afterEach(() => {
  sendGTMEvent.mockReset();
});

const pushed = () => sendGTMEvent.mock.calls[0]?.[0] as Record<string, unknown>;

describe('registry coverage', () => {
  test('the registry declares exactly the events this file asserts literally', () => {
    expect([...EVENT_NAMES].sort()).toStrictEqual([
      'abstract_tab_view',
      'author_list_exported',
      'author_list_opened',
      'discipline_change',
      'export',
      'facet_applied',
      'full_text_click',
      'result_click',
      'search_example_click',
      'search_no_results',
      'tour_cancel',
      'tour_complete',
      'tour_start',
      'tour_step',
      'user_update',
      'view_item',
    ]);
  });

  test('the names GTM stopped listening for are gone from the registry', () => {
    const retired = ['citation_export', 'author_list_open', 'author_list_export', 'app_mode_change', 'web_vitals'];
    expect(retired.filter((name) => (EVENT_NAMES as readonly string[]).includes(name))).toStrictEqual([]);
  });
});

describe('event payloads', () => {
  test('abstract_tab_view', () => {
    track('abstract_tab_view', { tab: 'citations', bibcode: '2020ApJ...900L..21F' });

    expect(pushed()).toStrictEqual({
      event: 'abstract_tab_view',
      tab: 'citations',
      bibcode: '2020ApJ...900L..21F',
    });
  });

  test('author_list_opened', () => {
    track('author_list_opened');

    expect(pushed()).toStrictEqual({ event: 'author_list_opened' });
  });

  test('author_list_exported', () => {
    track('author_list_exported');

    expect(pushed()).toStrictEqual({ event: 'author_list_exported' });
  });

  test('discipline_change', () => {
    track('discipline_change', { discipline: 'ASTROPHYSICS' });

    expect(pushed()).toStrictEqual({ event: 'discipline_change', discipline: 'ASTROPHYSICS' });
  });

  test('export', () => {
    track('export', { export_type: 'download', export_format: 'bibtex' });

    expect(pushed()).toStrictEqual({ event: 'export', export_type: 'download', export_format: 'bibtex' });
  });

  test('facet_applied', () => {
    track('facet_applied', { facet_field: 'author_facet_hier', facet_logic: 'limit to' });

    expect(pushed()).toStrictEqual({
      event: 'facet_applied',
      facet_field: 'author_facet_hier',
      facet_logic: 'limit to',
    });
  });

  test('full_text_click', () => {
    track('full_text_click', {
      source_name: 'Publisher',
      is_open_access: true,
      bibcode: '2020ApJ...900L..21F',
      rank: 3,
    });

    expect(pushed()).toStrictEqual({
      event: 'full_text_click',
      source_name: 'Publisher',
      is_open_access: true,
      bibcode: '2020ApJ...900L..21F',
      rank: 3,
    });
  });

  test('result_click', () => {
    track('result_click', { rank: 0, bibcode: '2020ApJ...900L..21F' });

    expect(pushed()).toStrictEqual({ event: 'result_click', rank: 0, bibcode: '2020ApJ...900L..21F' });
  });

  test('search_example_click', () => {
    track('search_example_click', { search_example: 'author:"huchra, john"' });

    expect(pushed()).toStrictEqual({
      event: 'search_example_click',
      search_example: 'author:"huchra, john"',
    });
  });

  test('search_no_results', () => {
    track('search_no_results', { query: 'star', query_type: 'basic' });

    expect(pushed()).toStrictEqual({ event: 'search_no_results', query: 'star', query_type: 'basic' });
  });

  test('tour_start', () => {
    track('tour_start', { tour_type: 'home', is_mobile: false });

    expect(pushed()).toStrictEqual({ event: 'tour_start', tour_type: 'home', is_mobile: false });
  });

  test('tour_step', () => {
    track('tour_step', { tour_type: 'results', step_id: 'facets' });

    expect(pushed()).toStrictEqual({ event: 'tour_step', tour_type: 'results', step_id: 'facets' });
  });

  test('tour_complete', () => {
    track('tour_complete', { tour_type: 'abstract' });

    expect(pushed()).toStrictEqual({ event: 'tour_complete', tour_type: 'abstract' });
  });

  test('tour_cancel', () => {
    track('tour_cancel', { tour_type: 'home', step_id: 'welcome' });

    expect(pushed()).toStrictEqual({ event: 'tour_cancel', tour_type: 'home', step_id: 'welcome' });
  });

  test('user_update', () => {
    track('user_update', { user_id: 'e3b0c44298fc1c149afbf4c8996fb924' });

    expect(pushed()).toStrictEqual({ event: 'user_update', user_id: 'e3b0c44298fc1c149afbf4c8996fb924' });
  });

  test('view_item', () => {
    track('view_item', {
      ecommerce: {
        items: [
          {
            item_id: '2020ApJ...900L..21F',
            item_name: 'A Galaxy',
            item_brand: 'ApJ',
            item_category: 'astronomy',
            item_category2: 'galaxies',
            item_category3: 'redshift',
            item_variant: 'article',
            quantity: 1,
          },
        ],
      },
    });

    expect(pushed()).toStrictEqual({
      event: 'view_item',
      ecommerce: {
        items: [
          {
            item_id: '2020ApJ...900L..21F',
            item_name: 'A Galaxy',
            item_brand: 'ApJ',
            item_category: 'astronomy',
            item_category2: 'galaxies',
            item_category3: 'redshift',
            item_variant: 'article',
            quantity: 1,
          },
        ],
      },
    });
  });

  test('view_item does not send value or currency, which would seed GA4 revenue metrics', () => {
    track('view_item', {
      ecommerce: { items: [{ item_id: 'X', item_name: 'X', quantity: 1 }] },
    });

    const ecommerce = pushed().ecommerce as Record<string, unknown>;
    expect(ecommerce).not.toHaveProperty('value');
    expect(ecommerce).not.toHaveProperty('currency');
    expect(Object.keys(ecommerce)).toStrictEqual(['items']);
  });
});

describe('undefined is stripped, null is preserved', () => {
  test('an undefined optional parameter is absent from the push, not undefined', () => {
    track('full_text_click', {
      source_name: 'Publisher',
      is_open_access: false,
      bibcode: '2020ApJ...900L..21F',
      rank: undefined,
    });

    expect(pushed()).not.toHaveProperty('rank');
    expect(pushed()).toStrictEqual({
      event: 'full_text_click',
      source_name: 'Publisher',
      is_open_access: false,
      bibcode: '2020ApJ...900L..21F',
    });
  });

  test('an undefined value nested inside an ecommerce item is stripped too', () => {
    track('view_item', {
      ecommerce: {
        items: [
          {
            item_id: '2020ApJ...900L..21F',
            item_name: 'A Galaxy',
            item_brand: undefined,
            item_category: 'astronomy',
            item_category2: undefined,
            quantity: 1,
          },
        ],
      },
    });

    const items = (pushed().ecommerce as { items: Record<string, unknown>[] }).items;
    expect(items[0]).not.toHaveProperty('item_brand');
    expect(items[0]).not.toHaveProperty('item_category2');
    expect(items[0]).toStrictEqual({
      item_id: '2020ApJ...900L..21F',
      item_name: 'A Galaxy',
      item_category: 'astronomy',
      quantity: 1,
    });
  });

  test('an explicit null survives at the top level, because GTM needs it to clear a retained value', () => {
    track('user_update', { user_id: null });

    expect(pushed()).toStrictEqual({ event: 'user_update', user_id: null });
  });

  test('an explicit null survives nested inside ecommerce', () => {
    track('view_item', {
      ecommerce: {
        items: [{ item_id: 'X', item_name: 'X', item_brand: null, item_category: 'astronomy', quantity: 1 }],
      },
    });

    const items = (pushed().ecommerce as { items: Record<string, unknown>[] }).items;
    expect(items[0]).toStrictEqual({
      item_id: 'X',
      item_name: 'X',
      item_brand: null,
      item_category: 'astronomy',
      quantity: 1,
    });
  });
});

describe('exported contract', () => {
  test('describes parameter names, requiredness and nullability per event', () => {
    const contract = exportContract();

    expect(contract.tour_cancel).toStrictEqual({
      params: {
        tour_type: { type: 'string', required: true, nullable: false },
        step_id: { type: 'string', required: true, nullable: true },
      },
    });
  });

  test('describes the nested ecommerce shape for view_item', () => {
    const contract = exportContract();

    expect(contract.view_item.params.ecommerce).toStrictEqual({
      type: 'object',
      required: true,
      nullable: false,
      params: {
        items: {
          type: 'object[]',
          required: true,
          nullable: false,
          params: {
            item_id: { type: 'string', required: true, nullable: false },
            item_name: { type: 'string', required: true, nullable: false },
            item_brand: { type: 'string', required: false, nullable: true },
            item_category: { type: 'string', required: false, nullable: true },
            item_category2: { type: 'string', required: false, nullable: true },
            item_category3: { type: 'string', required: false, nullable: true },
            item_variant: { type: 'string', required: false, nullable: true },
            quantity: { type: 'number', required: true, nullable: false },
          },
        },
      },
    });
  });

  test('covers every registered event', () => {
    expect(Object.keys(exportContract()).sort()).toStrictEqual([...EVENT_NAMES].sort());
  });
});

describe('committed contract artifact', () => {
  test('contract.json is in sync with the registry', () => {
    const committed = JSON.parse(readFileSync(join(__dirname, 'contract.json'), 'utf8')) as Record<string, unknown>;

    expect(committed).toStrictEqual(JSON.parse(JSON.stringify(exportContract())));
  });
});
