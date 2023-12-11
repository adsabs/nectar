import { calculatePage } from '@components/ResultList/Pagination/usePagination';
import { AppState, useStore } from '@store';
import { makeSearchParams } from '@utils';
import { useCallback } from 'react';
import { SimpleLinkProps } from '@components';

const selector = {
  latestQuery: (state: AppState) => state.latestQuery,
};

export const useBackToSearchResults = () => {
  const latestQuery = useStore(selector.latestQuery);
  const show = latestQuery.q !== '';

  const getLinkProps = useCallback<() => SimpleLinkProps>(() => {
    const search = makeSearchParams({ ...latestQuery, p: calculatePage(latestQuery.start, latestQuery.rows) });
    return { href: { pathname: '/search', search } };
  }, [latestQuery]);

  return {
    getLinkProps,
    show,
  };
};
