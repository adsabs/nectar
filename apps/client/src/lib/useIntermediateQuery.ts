import { useStore } from '@/store';
import { useDebouncedCallback } from 'use-debounce';

export const useIntermediateQuery = () => {
  const query = useStore((state) => state.query.q);
  const updateQuery = useStore((state) => state.updateQuery);
  const setQueryAddition = useStore((state) => state.setQueryAddition);
  const queryAddition = useStore((state) => state.queryAddition);
  const clearQueryFlag = useStore((state) => state.clearQueryFlag);
  const setClearQueryFlag = useStore((state) => state.setClearQueryFlag);

  const updateQ = useDebouncedCallback(
    (q: string) => {
      updateQuery({ q });
    },
    60,
    { leading: true },
  );

  const appendToQuery = useDebouncedCallback(
    (value: string) => {
      setQueryAddition(value);
    },
    300,
    { leading: true },
  );

  return {
    query,
    updateQuery: updateQ,

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
