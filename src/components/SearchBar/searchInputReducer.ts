import { TypeaheadOption } from '@/components/SearchBar/types';
import { Reducer } from 'react';
import {
  appendSearchTerm,
  extractFinalTerm,
  filterItems,
  getCursorPosition,
  updateSearchTerm,
  updateUATSearchTerm,
  wrapSelectedWithField,
} from '@/components/SearchBar/helpers';
import { typeaheadOptions } from '@/components/SearchBar/models';

export interface ISearchInputState {
  isOpen: boolean;
  searchTerm: string;
  uatItems: TypeaheadOption[];
  items: TypeaheadOption[];
  focused: number;
  cursorPosition: number;
  selectedRange?: [number, number];
}

export type SearchInputAction =
  | { type: 'SET_SEARCH_TERM'; payload: { query: string; cursorPosition?: number } }
  | { type: 'SET_UAT_TYPEAHEAD_OPTIONS'; payload: TypeaheadOption[] }
  | { type: 'SET_SEARCH_TERM_ADDITION'; payload: { queryAddition: string } }
  | { type: 'SET_SELECTED_RANGE'; payload: [number, number] }
  | { type: 'CLICK_ITEM' }
  | { type: 'FOCUS_ITEM'; index: number }
  | { type: 'KEYDOWN_ENTER' }
  | { type: 'KEYDOWN_ESCAPE' }
  | { type: 'HARD_RESET' }
  | { type: 'SOFT_RESET' }
  | { type: 'KEYDOWN_ARROW_DOWN' }
  | { type: 'KEYDOWN_ARROW_UP' }
  | { type: 'KEYDOWN_TAB' };

export const reducer: Reducer<ISearchInputState, SearchInputAction> = (state, action) => {
  switch (action.type) {
    case 'SOFT_RESET':
      return { ...initialState, searchTerm: state.searchTerm, cursorPosition: state.cursorPosition };
    case 'HARD_RESET':
      return initialState;
    case 'SET_SEARCH_TERM': {
      const finalTerm = extractFinalTerm(action.payload.query);
      const cursorPosition = action.payload.cursorPosition ?? action.payload.query.length;

      if (finalTerm === '' || finalTerm.toLowerCase().startsWith('uat:')) {
        return {
          ...state,
          isOpen: false,
          searchTerm: action.payload.query,
          uatItems: [],
          focused: -1,
          items: [],
          cursorPosition,
        };
      }

      const newItems = filterItems(finalTerm, typeaheadOptions);

      const isSame =
        state.searchTerm === action.payload.query &&
        state.cursorPosition === cursorPosition &&
        state.focused === -1 &&
        state.items.length === newItems.length &&
        state.items.every((item, idx) => item.id === newItems[idx]?.id);

      if (isSame) {
        return state;
      }

      return {
        ...state,
        isOpen: newItems.length > 0,
        searchTerm: action.payload.query,
        uatItems: [],
        focused: -1,
        cursorPosition,
        items: newItems,
      };
    }

    case 'SET_UAT_TYPEAHEAD_OPTIONS': {
      const uatOptions = action.payload;
      return {
        ...state,
        isOpen: uatOptions.length > 0,
        uatItems: uatOptions,
        focused: 0,
        items: [],
      };
    }
    case 'SET_SEARCH_TERM_ADDITION': {
      const { queryAddition } = action.payload;
      const selectedRange = state.selectedRange || [0, 0];
      const selection = state.searchTerm.slice(selectedRange[0], selectedRange[1]);

      if (typeof selection === 'string' && selection.trim().length > 0) {
        // if selection is not empty, replace it with the query addition
        const searchTerm = wrapSelectedWithField(state.searchTerm, selectedRange[0], selectedRange[1], queryAddition);
        return {
          ...state,
          searchTerm,
          cursorPosition: getCursorPosition(searchTerm),
        };
      }

      const searchTerm = appendSearchTerm(state.searchTerm, queryAddition);
      return {
        ...state,
        searchTerm,
        cursorPosition: getCursorPosition(searchTerm),
      };
    }
    case 'KEYDOWN_ARROW_DOWN': {
      // if menu is closed, open menu and focus first item
      if (!state.isOpen) {
        // if final character is not a space, add a space
        const searchTerm = state.searchTerm.endsWith(' ') ? state.searchTerm : appendSearchTerm(state.searchTerm, '');

        return {
          ...state,
          isOpen: true,
          focused: 0,
          searchTerm,

          // if no items, show all items
          items: state.items.length === 0 && state.uatItems.length === 0 ? typeaheadOptions : state.items,
        };
      }

      // if menu is open, and we're at the bottom, cycle to the top
      if (
        (state.items.length > 0 && state.focused === state.items.length - 1) ||
        (state.uatItems.length > 0 && state.focused === state.uatItems.length - 1)
      ) {
        return {
          ...state,
          focused: -1,
        };
      }

      return {
        ...state,
        focused: state.focused + 1,
      };
    }

    case 'KEYDOWN_ARROW_UP': {
      // if menu is open, and we're at the top, cycle to the bottom
      if (state.focused === -1 && (state.items.length > 0 || state.uatItems.length > 0) && state.isOpen) {
        return {
          ...state,
          focused: state.items.length - 1,
        };
      }

      return {
        ...state,
        focused: state.focused - 1,
      };
    }

    case 'KEYDOWN_TAB':
    case 'CLICK_ITEM':
    case 'KEYDOWN_ENTER': {
      // if menu is open, and we're focused on an item, select it
      if (state.focused > -1) {
        if (state.items.length > 0) {
          const searchTerm = updateSearchTerm(state.searchTerm, state.items[state.focused].value);
          return {
            ...state,
            isOpen: false,
            focused: -1,
            searchTerm,
            cursorPosition: getCursorPosition(searchTerm),
          };
        } else if (state.uatItems.length > 0) {
          const searchTerm = updateUATSearchTerm(state.searchTerm, state.uatItems[state.focused].value);
          return {
            ...state,
            isOpen: false,
            focused: -1,
            searchTerm,
            cursorPosition: getCursorPosition(searchTerm),
          };
        }
      }

      // if menu is closed, and we're not focused on an item, do nothing
      return {
        ...state,
        isOpen: false,
        focused: -1,
      };
    }

    case 'KEYDOWN_ESCAPE':
      return state.isOpen ? { ...state, isOpen: false, focused: -1 } : state;

    case 'FOCUS_ITEM':
      return { ...state, focused: action.index };

    case 'SET_SELECTED_RANGE':
      return { ...state, selectedRange: action.payload };

    default:
      return state;
  }
};
export const initialState: ISearchInputState = {
  isOpen: false,
  searchTerm: '',
  uatItems: [],
  items: [],
  focused: -1,
  cursorPosition: 0,
};
