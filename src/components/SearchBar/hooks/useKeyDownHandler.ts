import { SearchInputAction } from '@/components/SearchBar/searchInputReducer';
import { Dispatch, KeyboardEventHandler } from 'react';

interface IUseKeyDownHandlerProps {
  isOpen: boolean;
  dispatch: Dispatch<SearchInputAction>;
}

export const useKeyDownHandler = (props: IUseKeyDownHandlerProps): KeyboardEventHandler<HTMLInputElement> => {
  const { isOpen, dispatch } = props;
  return (e) => {
    // if any modifier keys, ignore
    if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) {
      return;
    }

    if (e.key === 'Enter' && isOpen) {
      e.preventDefault();
      dispatch({ type: 'KEYDOWN_ENTER' });
    } else if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      dispatch({ type: 'KEYDOWN_ESCAPE' });
    } else if (e.key === 'ArrowUp' && isOpen) {
      e.preventDefault();
      dispatch({ type: 'KEYDOWN_ARROW_UP' });
    } else if (e.key === 'Tab' && isOpen) {
      e.preventDefault();
      dispatch({ type: 'KEYDOWN_TAB' });
    }

    if (e.key === 'ArrowDown' && e.currentTarget.selectionStart === e.currentTarget.value.length) {
      e.preventDefault();
      dispatch({ type: 'KEYDOWN_ARROW_DOWN' });
    }
  };
};
