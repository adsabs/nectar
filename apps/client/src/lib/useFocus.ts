import { MutableRefObject, useEffect, useRef } from 'react';

interface IUseFocusProps {
  focusOnMount?: boolean;

  /** if element is an input, select the text on focus */
  selectTextOnFocus?: boolean;

  moveCursorToEnd?: boolean;
}

/**
 * Focus an element on mount
 * @example
 * const [ref, focus] = useFocus();
 *
 * @param props
 */
export const useFocus = <TElement extends HTMLElement = HTMLInputElement>(
  props: IUseFocusProps = { focusOnMount: true, selectTextOnFocus: true, moveCursorToEnd: true },
): [MutableRefObject<TElement>, (overrides?: IUseFocusProps) => void] => {
  const { focusOnMount, selectTextOnFocus, moveCursorToEnd } = props;
  const ref = useRef<TElement>(null);

  const focus = (overrides?: IUseFocusProps) => {
    if (typeof ref.current?.focus === 'function' && typeof window !== 'undefined') {
      const shouldSelectTextOnFocus = overrides?.selectTextOnFocus ?? selectTextOnFocus;
      const shouldMoveCursorToEnd = overrides?.moveCursorToEnd ?? moveCursorToEnd;

      // override takes precedence, otherwise use props
      if (shouldSelectTextOnFocus && ref.current instanceof HTMLInputElement) {
        ref.current?.select();
      }

      ref.current?.focus();

      // if the element is an input, move the cursor to the end
      if (shouldMoveCursorToEnd && ref.current instanceof HTMLInputElement && ref.current.selectionStart) {
        ref.current.selectionStart = ref.current.value.length;
      }
    }
  };

  useEffect(() => {
    if (focusOnMount) {
      focus();
    }
  }, []);

  return [ref, focus];
};
