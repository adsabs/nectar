import { beforeEach, describe, expect, test, vi } from 'vitest';

import * as helpers from '@/components/SearchBar/helpers';
import { initialState, ISearchInputState, reducer } from '../searchInputReducer';
import { TypeaheadOption } from '@/components/SearchBar/types';

const uatOptions: Array<TypeaheadOption> = [
  { value: '"Tektites"', label: 'Tektites', desc: '', id: 2, match: [] },
  { value: '"Transits"', label: 'Transits', desc: '', id: 1, match: [] },
];

const keywordItem: TypeaheadOption = { value: 'similar()', label: 'Similar', desc: '', id: 1, match: [] };

const mockStateWithQuery = (query: string): ISearchInputState => ({
  ...initialState,
  searchTerm: query,
  cursorPosition: query.length,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SearchInput reducer', () => {
  describe('Reset behavior', () => {
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
    test('SET_SEARCH_TERM with "uat:" disables typeahead suggestions', () => {
      vi.spyOn(helpers, 'extractFinalTerm').mockReturnValue('uat:');
      const state = mockStateWithQuery('author:"star" uat:');
      const result = reducer(state, {
        type: 'SET_SEARCH_TERM',
        payload: { query: 'author:"star" uat:', cursorPosition: 18 },
      });
      expect(result.isOpen).toBe(false);
      expect(result.items).toEqual([]);
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
  });

  describe('Typeahead results and UAT integration', () => {
    test('SET_UAT_TYPEAHEAD_OPTIONS opens menu and sets focused to 0', () => {
      const result = reducer(initialState, {
        type: 'SET_UAT_TYPEAHEAD_OPTIONS',
        payload: uatOptions,
      });
      expect(result.isOpen).toBe(true);
      expect(result.uatItems).toHaveLength(2);
      expect(result.focused).toBe(0);
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
      vi.spyOn(helpers, 'extractFinalTerm').mockReturnValue('uat:');
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
      expect(state.focused).toBe(0);
      vi.spyOn(helpers, 'updateUATSearchTerm').mockReturnValue('author:"star" uat:"Tektites"');
      state = reducer(state, { type: 'CLICK_ITEM' });
      expect(state.searchTerm).toContain('"Tektites"');
      expect(state.isOpen).toBe(false);
      vi.spyOn(helpers, 'extractFinalTerm').mockReturnValue('similar');
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
