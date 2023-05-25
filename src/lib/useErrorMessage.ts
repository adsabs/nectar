import { useEffect, useRef, useState } from 'react';

export const useErrorMessage = <T>(error: T, delay = 5000) => {
  const id = useRef<number>(null);
  const output = useState<T>(error);

  useEffect(() => {
    id.current = setTimeout(output[1], delay, null);
    return () => clearTimeout(id.current);
  }, [output[0]]);

  return output;
};
