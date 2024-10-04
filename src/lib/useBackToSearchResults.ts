import { calculatePage } from '@/components/ResultList/Pagination/usePagination';
import { AppState, useStore } from '@/store';
import { useCallback } from 'react';
import { ISimpleLinkProps } from '@/components/SimpleLink';
import { makeSearchParams } from '@/utils/common/search';

const selector = {
  latestQuery: (state: AppState) => state.latestQuery,
};

export const useBackToSearchResults = () => {
  const latestQuery = useStore(selector.latestQuery);
  const show = latestQuery.q !== '';

  const getSearchHref = useCallback<() => ISimpleLinkProps['href']>(() => {
    const search = makeSearchParams({ ...latestQuery, p: calculatePage(latestQuery.start, latestQuery.rows) });
    return { pathname: '/search', search };
  }, [latestQuery]);

  return {
    getSearchHref,
    show,
  };
};
