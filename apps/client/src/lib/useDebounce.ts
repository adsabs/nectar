import { useEffect, useState } from 'react';

const DEFAULT_DELAY = 500;

/**
 * useDebounce hook
 *
 * debounce value for some specified (optional) delay
 *
 * @link https://usehooks-ts.com/react-hook/use-debounce
 */
export const useDebounce = <T>(value: T, delay?: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || DEFAULT_DELAY);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};
