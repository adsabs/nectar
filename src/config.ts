import { SolrSort } from '@api';

export const APP_DEFAULTS = {
  DETAILS_MAX_AUTHORS: 50,
  RESULTS_MAX_AUTHORS: 10,
  RESULT_PER_PAGE: 10,
  PER_PAGE_OPTIONS: [10, 25, 50, 100],
  SORT: ['date desc', 'bibcode desc'] as SolrSort[],
  QUERY_SORT_POSTFIX: 'bibcode desc' as SolrSort,
  EXPORT_PAGE_SIZE: 500,
  AUTHOR_AFF_SEARCH_SIZE: 100
} as const;
