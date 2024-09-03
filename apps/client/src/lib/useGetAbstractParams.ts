import { useCallback, useEffect, useRef, useState } from 'react';

import { AppState, useStore } from '@/store';

/**
 * Helper hook for handling pagination in abstract subpages
 */
export const useGetAbstractParams = (id = '', initialStart = 0) => {
  const [start, setStart] = useState(initialStart);
  const pageSize = useStore((state: AppState) => state.numPerPage);

  const prev = useRef<string>(id);
  useEffect(() => {
    prev.current = id;
  });

  // reset start if the previous bibcode is different than the current
  const getParams = useCallback(
    () => ({ bibcode: id, start: prev.current === id ? start * pageSize : 0 }),
    [id, start, pageSize],
  );
  return { getParams, onPageChange: setStart };
};
