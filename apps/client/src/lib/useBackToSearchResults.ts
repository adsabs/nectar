import { IADSApiSearchParams } from '@/api';
import { makeSearchParams } from '@/utils';

export const useBackToSearchResults = ({ query = { q: '*:*' } }: { query: IADSApiSearchParams }) => {
  // don't show if the query is the default (all results)
  const show = query?.q !== '*:*';

  const getSearchHref = () => {
    return { pathname: '/search', search: makeSearchParams(query) };
  };

  return {
    getSearchHref,
    show,
  };
};
