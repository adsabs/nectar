import { beforeEach, describe, expect, test, vi } from 'vitest';

import * as helpers from '@/components/SearchBar/helpers';
import { initialState, ISearchInputState, reducer } from '../searchInputReducer';
import { TypeaheadOption } from '@/components/SearchBar/types';

const uatOptions: Array<TypeaheadOption> = [
  { value: '"Tektites"', label: 'Tektites', desc: '', id: 2, match: [] },
  { value: '"Transits"', label: 'Transits', desc: '', id: 1, match: [] },
];

const journalOptions: Array<TypeaheadOption> = [
  { value: '"ApJ"', label: 'Astrophysical Journal', desc: 'Bibstem: ApJ', id: 0, match: [] },
  { value: '"AJ"', label: 'Astronomical Journal', desc: 'Bibstem: AJ', id: 1, match: [] },
];

const keywordItem: TypeaheadOption = { value: 'similar()', label: 'Similar', desc: '', id: 1, match: [] };

const mockStateWithQuery = (query: string): ISearchInputState => ({
  ...initialState,
  searchTerm: query,
  cursorPosition: query.length,
});

describe('SearchInput reducer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  describe('Reset behavior', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });
    test('HARD_RESET resets to initialState', () => {
      const newState = reducer({ ...initialState, searchTerm: 'foo' }, { type: 'HARD_RESET' });
      expect(newState).toEqual(initialState);
    });

    test('SOFT_RESET preserves searchTerm and cursorPosition', () => {
      const prevState: ISearchInputState = {
        ...initialState,
        searchTerm: 'keep this',
        cursorPosition: 5,
      };
      const result = reducer(prevState, { type: 'SOFT_RESET' });
      expect(result.searchTerm).toBe('keep this');
      expect(result.cursorPosition).toBe(5);
    });
  });

  describe('Search term input and suggestions', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });
    test('SET_SEARCH_TERM with "pub:" disables typeahead suggestions', () => {
      const state = mockStateWithQuery('author:"star" pub:');
      const result = reducer(state, {
        type: 'SET_SEARCH_TERM',
        payload: { query: 'author:"star" pub:', cursorPosition: 18 },
      });
      expect(result.isOpen).toBe(false);
      expect(result.items).toEqual([]);
      expect(result.journalItems).toEqual([]);
    });

    test('SET_SEARCH_TERM_ADDITION replaces selected range with wrapped field', () => {
      vi.spyOn(helpers, 'wrapSelectedWithField').mockReturnValue('author:"star"');
      vi.spyOn(helpers, 'getCursorPosition').mockReturnValue(13);
      const state: ISearchInputState = {
        ...initialState,
        searchTerm: 'star',
        selectedRange: [0, 4],
      };
      const result = reducer(state, {
        type: 'SET_SEARCH_TERM_ADDITION',
        payload: { queryAddition: 'author:""' },
      });
      expect(result.searchTerm).toBe('author:"star"');
      expect(result.cursorPosition).toBe(13);
    });

    test('SET_SEARCH_TERM_ADDITION appends term when no selection', () => {
      vi.spyOn(helpers, 'appendSearchTerm').mockReturnValue('foo bar');
      vi.spyOn(helpers, 'getCursorPosition').mockReturnValue(7);
      const state: ISearchInputState = {
        ...initialState,
        searchTerm: 'foo',
      };
      const result = reducer(state, {
        type: 'SET_SEARCH_TERM_ADDITION',
        payload: { queryAddition: 'bar' },
      });
      expect(result.searchTerm).toBe('foo bar');
      expect(result.cursorPosition).toBe(7);
    });

    test('Exact item match closes the menu', () => {
      const result = reducer(initialState, { type: 'SET_SEARCH_TERM', payload: { query: 'doctype:inproceedings' } });
      expect(result.searchTerm).toBe('doctype:inproceedings');
      expect(result.isOpen).toBe(false);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].value).toBe('doctype:inproceedings');
    });
  });

  describe('Typeahead results and UAT/Journal integration', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });
    test('SET_UAT_TYPEAHEAD_OPTIONS opens menu and does not auto-focus', () => {
      const result = reducer(initialState, {
        type: 'SET_UAT_TYPEAHEAD_OPTIONS',
        payload: [uatOptions[0], uatOptions[1]],
      });
      expect(result.isOpen).toBe(true);
      expect(result.uatItems).toHaveLength(2);
      expect(result.journalItems).toHaveLength(0);
      expect(result.focused).toBe(-1);
    });
    test('SET_JOURNAL_TYPEAHEAD_OPTIONS opens menu and does not auto-focus', () => {
      const result = reducer(initialState, {
        type: 'SET_JOURNAL_TYPEAHEAD_OPTIONS',
        payload: [journalOptions[0], journalOptions[1]],
      });
      expect(result.isOpen).toBe(true);
      expect(result.journalItems).toHaveLength(2);
      expect(result.uatItems).toHaveLength(0);
      expect(result.focused).toBe(-1);
    });

    test('CLICK_ITEM inserts focused UAT item using updateUATSearchTerm', () => {
      vi.spyOn(helpers, 'updateUATSearchTerm').mockReturnValue('author:"star" uat:"Tektites"');
      const state: ISearchInputState = {
        ...initialState,
        searchTerm: 'author:"star" uat:"t"',
        uatItems: uatOptions,
        focused: 0,
        isOpen: true,
      };
      const result = reducer(state, { type: 'CLICK_ITEM' });
      expect(result.searchTerm).toBe('author:"star" uat:"Tektites"');
      expect(result.isOpen).toBe(false);
      expect(result.focused).toBe(-1);
    });

    test('CLICK_ITEM inserts focused journal item using updateJournalSearchTerm', () => {
      vi.spyOn(helpers, 'updateJournalSearchTerm').mockReturnValue('author:"star" pub:"ApJ"');
      const state: ISearchInputState = {
        ...initialState,
        searchTerm: 'author:"star" pub:"ap"',
        journalItems: journalOptions,
        focused: 0,
        isOpen: true,
      };
      const result = reducer(state, { type: 'CLICK_ITEM' });
      expect(result.searchTerm).toBe('author:"star" pub:"ApJ"');
      expect(result.isOpen).toBe(false);
      expect(result.focused).toBe(-1);
    });

    test('CLICK_ITEM with no focused item does not change searchTerm', () => {
      const state: ISearchInputState = {
        ...initialState,
        isOpen: true,
        items: [keywordItem],
        focused: -1,
        searchTerm: 'foo',
      };
      const result = reducer(state, { type: 'CLICK_ITEM' });
      expect(result.searchTerm).toBe('foo');
      expect(result.isOpen).toBe(false);
    });

    test('Hybrid flow: uat selection followed by normal keyword search resumes typeahead', () => {
      const uatItem: TypeaheadOption = { value: '"Tektites"', label: 'Tektites', desc: '', id: 0, match: [] };
      let state = reducer(initialState, {
        type: 'SET_SEARCH_TERM',
        payload: { query: 'author:"star" uat:', cursorPosition: 18 },
      });
      expect(state.isOpen).toBe(false);
      state = reducer(state, {
        type: 'SET_UAT_TYPEAHEAD_OPTIONS',
        payload: [uatItem],
      });
      expect(state.isOpen).toBe(true);
      expect(state.focused).toBe(-1);
      // Focus on the first item before clicking
      state = reducer(state, { type: 'FOCUS_ITEM', index: 0 });
      expect(state.focused).toBe(0);
      vi.spyOn(helpers, 'updateUATSearchTerm').mockReturnValue('author:"star" uat:"Tektites"');
      state = reducer(state, { type: 'CLICK_ITEM' });
      expect(state.searchTerm).toContain('"Tektites"');
      expect(state.isOpen).toBe(false);
      vi.spyOn(helpers, 'filterItems').mockReturnValue([keywordItem]);
      state = reducer(state, {
        type: 'SET_SEARCH_TERM',
        payload: { query: 'author:"star" uat:"Tektites" similar', cursorPosition: 36 },
      });
      expect(state.isOpen).toBe(true);
      expect(state.items).toHaveLength(1);
      expect(state.items[0].value).toBe('similar()');
    });
  });

  describe('Keyboard navigation', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });
    test('KEYDOWN_ARROW_DOWN cycles to -1 if focused on last item', () => {
      const state: ISearchInputState = {
        ...initialState,
        isOpen: true,
        items: [keywordItem, keywordItem],
        focused: 1,
      };
      const result = reducer(state, { type: 'KEYDOWN_ARROW_DOWN' });
      expect(result.focused).toBe(-1);
    });

    test('KEYDOWN_ARROW_UP from -1 sets focus to last item', () => {
      const state: ISearchInputState = {
        ...initialState,
        isOpen: true,
        items: [keywordItem, keywordItem],
        focused: -1,
      };
      const result = reducer(state, { type: 'KEYDOWN_ARROW_UP' });
      expect(result.focused).toBe(1);
    });

    test('KEYDOWN_ESCAPE closes dropdown if open', () => {
      const state = { ...initialState, isOpen: true, focused: 1 };
      const result = reducer(state, { type: 'KEYDOWN_ESCAPE' });
      expect(result.isOpen).toBe(false);
      expect(result.focused).toBe(-1);
    });

    test('FOCUS_ITEM applies given index', () => {
      const result = reducer(initialState, { type: 'FOCUS_ITEM', index: 42 });
      expect(result.focused).toBe(42);
    });
  });
});
