import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Helper hook for handling pagination in abstract subpages
 */
export const useGetAbstractParams = (id: string) => {
  const [start, setStart] = useState(0);
  const prev = useRef<string>();
  useEffect(() => {
    prev.current = id;
  });

  // reset start if the previous bibcode is different than the current
  const getParams = useCallback(() => ({ bibcode: id, start: prev.current === id ? start : 0 }), [id, start]);
  return { getParams, onPageChange: setStart };
};
