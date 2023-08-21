import { MutableRefObject, useEffect, useRef } from 'react';

interface IUseFocusProps {
  focusOnMount?: boolean;

  /** if element is an input, select the text on focus */
  selectTextOnFocus?: boolean;
}

/**
 * Focus an element on mount
 * @example
 * const [ref, focus] = useFocus();
 *
 * @param props
 */
export const useFocus = <TElement extends HTMLElement = HTMLInputElement>(
  props: IUseFocusProps = { focusOnMount: true, selectTextOnFocus: true },
): [MutableRefObject<TElement>, () => void] => {
  const { focusOnMount } = props;
  const ref = useRef<TElement>(null);

  const focus = () => {
    if (typeof ref.current?.focus === 'function' && typeof window !== 'undefined') {
      if (props.selectTextOnFocus && ref.current instanceof HTMLInputElement) {
        ref.current?.select();
      }

      ref.current?.focus();
    }
  };

  useEffect(() => {
    if (focusOnMount) {
      focus();
    }
  }, []);

  return [ref, focus];
};
