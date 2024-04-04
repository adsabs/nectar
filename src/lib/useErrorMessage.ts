import { useEffect, useRef, useState } from 'react';

/**
 * Display an error message for a set amount of time
 *
 * @param error
 * @param delay
 */
export const useErrorMessage = <T>(error: T, delay = 5000) => {
  const id = useRef<number | null>(null);
  const output = useState<T>(error);

  useEffect(() => {
    id.current = window.setTimeout(output[1], delay, null);
    return () => clearTimeout(id.current);
  }, [output[0]]);

  return output;
};
