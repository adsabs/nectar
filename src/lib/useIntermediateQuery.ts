import { useStore } from '@/store';
import { useDebouncedCallback } from 'use-debounce';

export const useIntermediateQuery = () => {
  const query = useStore((state) => state.query.q);
  const updateQuery = useStore((state) => state.updateQuery);
  const setQueryAddition = useStore((state) => state.setQueryAddition);
  const queryAddition = useStore((state) => state.queryAddition);
  const clearQueryFlag = useStore((state) => state.clearQueryFlag);
  const setClearQueryFlag = useStore((state) => state.setClearQueryFlag);

  const updateQ = (q: string) => updateQuery({ q });
  const updateQDebounced = useDebouncedCallback(updateQ, 1000, { leading: true });
  const appendToQuery = useDebouncedCallback(
    (value: string) => {
      setQueryAddition(value);
    },
    300,
    { leading: true },
  );

  return {
    query: query,
    updateQuery: updateQ,
    debouncedUpdateQuery: updateQDebounced,

    // clearing
    isClearingQuery: clearQueryFlag,
    clearQuery: () => setClearQueryFlag(true),
    onDoneClearingQuery: () => setClearQueryFlag(false),

    // appending
    queryAddition,
    appendToQuery,
    onDoneAppendingToQuery: () => setQueryAddition(null),
  };
};
