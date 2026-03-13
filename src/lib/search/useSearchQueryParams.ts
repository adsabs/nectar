import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsNativeArrayOf,
  parseAsString,
  useQueryStates,
} from 'nuqs';
import { APP_DEFAULTS } from '@/config';
import { SolrSort } from '@/api/models';

/**
 * Parsers for all search URL params. The URL is the single source of truth
 * for search state — this replaces the Zustand search slice.
 *
 * fq uses repeated params (?fq=A&fq=B) to match the Solr API contract.
 * showHighlights is promoted from store state to URL so it's shareable.
 */
export const searchParamsParsers = {
  q: parseAsString.withDefault(''),
  sort: parseAsArrayOf(parseAsString).withDefault([...APP_DEFAULTS.SORT]),
  p: parseAsInteger.withDefault(1),
  rows: parseAsInteger.withDefault(APP_DEFAULTS.RESULT_PER_PAGE),
  fq: parseAsNativeArrayOf(parseAsString).withDefault([]),
  d: parseAsString.withDefault(''),
  showHighlights: parseAsBoolean.withDefault(false),
};

export type SearchQueryParams = {
  q: string;
  sort: SolrSort[];
  p: number;
  rows: number;
  fq: string[];
  d: string;
  showHighlights: boolean;
};

export const useSearchQueryParams = () => {
  const [params, setParams] = useQueryStates(searchParamsParsers, {
    history: 'push',
    urlKeys: { showHighlights: 'hl' },
  });

  /** Solr `start` offset derived from page number and rows per page */
  const start = (params.p - 1) * params.rows;

  return {
    params: params as SearchQueryParams,
    setParams,
    start,
  };
};
