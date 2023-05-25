import { calculatePage } from '@components/ResultList/Pagination/usePagination';
import { AppState, useStore } from '@store';
import { makeSearchParams } from '@utils';
import { LinkProps } from 'next/link';
import { useCallback } from 'react';

const selector = {
  latestQuery: (state: AppState) => state.latestQuery,
};

export const useBackToSearchResults = () => {
  const latestQuery = useStore(selector.latestQuery);
  const show = latestQuery.q !== '';

  const getLinkProps = useCallback<() => LinkProps>(() => {
    const search = makeSearchParams({ ...latestQuery, p: calculatePage(latestQuery.start, latestQuery.rows) });
    return { href: { pathname: '/search', search } };
  }, [latestQuery]);

  return {
    getLinkProps,
    show,
  };
};
