import { IADSApiSearchParams } from '@/api';
import { makeSearchParams } from '@/utils';

export const useBackToSearchResults = ({ query }: { query?: IADSApiSearchParams }) => {
  // don't show if the query is the default (all results)
  const show = !!query?.q;

  const getSearchHref = () => {
    if (!query) {
      return {};
    }
    return { pathname: '/search', search: makeSearchParams(query) };
  };

  return {
    getSearchHref,
    show,
  };
};
