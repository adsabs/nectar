import { noop } from '@utils';
import { createContext, Dispatch, SetStateAction } from 'react';
import { KeyboardFocusItem } from './types';

export const FacetContext = createContext<{
  keyboardFocus: KeyboardFocusItem;
  setKeyboardFocus: Dispatch<SetStateAction<KeyboardFocusItem>>;
  expanded: string[];
  setExpanded: Dispatch<SetStateAction<string[]>>;
  childrenCount: {
    [key: string]: number;
  };
  setChildrenCount: Dispatch<
    SetStateAction<{
      [key: string]: number;
    }>
  >;
}>({
  keyboardFocus: null,
  setKeyboardFocus: noop,
  expanded: [],
  setExpanded: noop,
  childrenCount: {},
  setChildrenCount: noop,
});
