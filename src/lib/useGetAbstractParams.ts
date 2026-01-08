import { AppState, useStore } from '@/store';
import { NumPerPageType } from '@/types';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Helper hook for handling pagination in abstract subpages
 */
export const useGetAbstractParams = (id: string, pageSize?: NumPerPageType) => {
  const [start, setStart] = useState(0);
  const defaultPageSize = useStore((state: AppState) => state.numPerPage);
  const [rows, setRows] = useState<NumPerPageType>(pageSize ?? defaultPageSize);

  const prev = useRef<string>();
  useEffect(() => {
    prev.current = id;
  });

  // reset start if the previous bibcode is different than the current
  const getParams = useCallback(
    () => ({
      bibcode: id,
      start: prev.current === id ? start * rows : 0,
      rows,
    }),
    [id, start, rows],
  );
  return { getParams, onPageChange: setStart, onPageSizeChange: setRows };
};
