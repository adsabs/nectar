import { SolrSort } from '@api';

export const APP_DEFAULTS = {
  DETAILS_MAX_AUTHORS: 50 as const,
  RESULT_PER_PAGE: 10 as const,
  PER_PAGE_OPTIONS: [10, 25, 50, 100] as const,
  SORT: ['date desc', 'bibcode desc'] as SolrSort[],
  QUERY_SORT_POSTFIX: 'bibcode desc' as SolrSort,
  EXPORT_PAGE_SIZE: 500 as const,
} as const;
