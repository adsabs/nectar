import type { SolrSort } from '@/api/models';

/**
 * Search mode constants, kept free of heavy imports — the store barrel
 * reaches this file, and searchMode.ts brings the lucene parser with it.
 */
export enum SearchMode {
  ALL_RELEVANT = 'ALL_RELEVANT',
  ADS_COMPAT = 'ADS_COMPAT',
}

export const SEARCH_MODE_OPTIONS = [
  {
    mode: SearchMode.ALL_RELEVANT,
    label: 'All relevant content',
    helperText: 'Standard SciX search across all content.',
  },
  {
    mode: SearchMode.ADS_COMPAT,
    label: 'ADS Compatibility mode',
    helperText: 'Search ADS-style astronomy and physics content, sorted by date.',
  },
] as const;

export const ADS_COMPAT_SORT: SolrSort[] = ['date desc'];
export const ADS_COMPAT_FQ_ENTRY = '{!type=aqp v=$fq_database}';
export const ADS_COMPAT_FQ_DATABASE = '(database:"astronomy" OR database:"physics")';
export const ADS_COMPAT_URL_PARAM = 'ads_compat';
