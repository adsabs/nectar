import { TypeaheadOption } from '@/components/SearchBar/types';
import { Reducer } from 'react';
import {
  appendSearchTerm,
  extractFinalTerm,
  filterItems,
  getCursorPosition,
  getFocusedItemValue,
  getPreview,
  updateSearchTerm,
} from '@/components/SearchBar/helpers';
import { typeaheadOptions } from '@/components/SearchBar/models';

export interface ISearchInputState {
  isOpen: boolean;
  searchTerm: string;
  items: TypeaheadOption[];
  focused: number;
  cursorPosition: number;
}

export type SearchInputAction =
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_SEARCH_TERM_ADDITION'; payload: string }
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
      if (extractFinalTerm(action.payload) === '') {
        return {
          ...state,
          isOpen: false,
          searchTerm: action.payload,
          focused: -1,
          items: [],
        };
      }
      const items = filterItems(extractFinalTerm(action.payload), typeaheadOptions);
      return {
        ...state,
        isOpen: items.length > 0,
        searchTerm: action.payload,
        focused: -1,
        items,
      };
    }
    case 'SET_SEARCH_TERM_ADDITION': {
      const searchTerm = appendSearchTerm(state.searchTerm, action.payload);
      return {
        ...state,
        searchTerm,
        preview: searchTerm,
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
          preview: searchTerm,

          // if no items, show all items
          items: state.items.length === 0 ? typeaheadOptions : state.items,
        };
      }

      // if menu is open, and we're at the bottom, cycle to the top
      if (state.focused === state.items.length - 1) {
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
      if (state.focused === -1 && state.items.length > 0 && state.isOpen) {
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
        const searchTerm = updateSearchTerm(state.searchTerm, state.items[state.focused].value);
        return {
          ...state,
          isOpen: false,
          focused: -1,
          searchTerm: getPreview(searchTerm, getFocusedItemValue(state.items, state.focused)),
          cursorPosition: getCursorPosition(searchTerm),
        };
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

    default:
      return state;
  }
};
export const initialState: ISearchInputState = {
  isOpen: false,
  searchTerm: '',
  items: [],
  focused: -1,
  cursorPosition: 0,
};
