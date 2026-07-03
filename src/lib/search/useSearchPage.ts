import { FormEventHandler, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { omit } from 'ramda';
import { sendGTMEvent } from '@next/third-parties/google';

import { SolrSort, SolrSortField, solrDefaultSortDirection } from '@/api/models';
import { defaultParams } from '@/api/search/models';
import { IADSApiSearchParams } from '@/api/search/types';
import { NumPerPageType } from '@/types';
import { useStore } from '@/store';
import shallow from 'zustand/shallow';
import { useApplyBoostTypeToParams } from '@/lib/useApplyBoostTypeToParams';
import { getQueryType } from '@/lib/performance';
import {
  getDefaultSortForQuery,
  makeSearchParams,
  normalizeSolrSort,
  toFacetSearchParams,
} from '@/utils/common/search';
import { useSearchQueryParams } from './useSearchQueryParams';
import { useSearchResults } from './useSearchResults';

const useDocsActions = () =>
  useStore(
    (state) => ({
      setDocs: state.setDocs,
      clearAllSelected: state.clearAllSelected,
      setNumPerPage: state.setNumPerPage,
    }),
    shallow,
  );

// Composes URL state, boost params, and search results with all page-level
// event handlers. Single import for the search page shell.
//
// Intentional store dependencies: appMode (via useApplyBoostTypeToParams),
// the docs slice (result publication + selection clearing), and the persisted
// page-size preference. Search state itself lives in the URL.
export const useSearchPage = () => {
  const router = useRouter();
  const { params, setParams, showHighlights, isReady, rawQuery } = useSearchQueryParams();
  const { setDocs, clearAllSelected: clearSelectedDocs, setNumPerPage } = useDocsActions();

  // start is pure URL math — never clamped against a previous query's numFound;
  // out-of-range pages are corrected after the response instead (below)
  const start = (params.p - 1) * params.rows;

  const { params: searchParams } = useApplyBoostTypeToParams({
    params: useMemo(
      () => ({ ...defaultParams, ...omit(['p'], params), start } as IADSApiSearchParams),
      [params, start],
    ),
  });

  const results = useSearchResults(searchParams, { enabled: isReady });

  // Facet/stats consumers need the same query identity latestQuery provided:
  // post-boost params, minus pagination and field-list keys
  const facetParams = useMemo(() => toFacetSearchParams(searchParams), [searchParams]);

  // Publish result bibcodes to the docs slice on genuine (non-previous) success —
  // selection state and telemetry span closure depend on this write
  useEffect(() => {
    if (results.searchStatus === 'success') {
      setDocs(results.docs.map((doc) => doc.bibcode));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.searchStatus, results.docs]);

  // Correct out-of-range page numbers once the active query's numFound is known
  useEffect(() => {
    if (results.searchStatus !== 'success') {
      return;
    }
    const lastPage = Math.max(1, Math.ceil(results.numFound / params.rows));
    if (params.p > lastPage) {
      void setParams({ p: lastPage }, { history: 'replace' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.searchStatus, results.numFound, params.p, params.rows]);

  // Track the last query that fired search_no_results to prevent duplicate
  // events when the empty state persists across re-renders
  const lastNoResultsQuery = useRef<string | null>(null);
  useEffect(() => {
    if (results.searchStatus === 'empty' && searchParams.q !== lastNoResultsQuery.current) {
      lastNoResultsQuery.current = searchParams.q ?? null;
      sendGTMEvent({
        event: 'search_no_results',
        query: searchParams.q,
        query_type: getQueryType(searchParams.q ?? ''),
      });
    }
    if (results.searchStatus !== 'empty') {
      lastNoResultsQuery.current = null;
    }
  }, [results.searchStatus, searchParams.q]);

  const onSubmit: FormEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      e.preventDefault();
      const q = (new FormData(e.currentTarget).get('q') as string) ?? '';
      if (q.length === 0) {
        return;
      }
      clearSelectedDocs();
      // second-order operator queries sort by relevance (SCIX-889)
      const sort = getDefaultSortForQuery(q, params.sort);
      void setParams({ q, sort, p: 1 });
    },
    [clearSelectedDocs, params.sort, setParams],
  );

  const onSortChange = useCallback(
    (sort: SolrSort) => {
      if (rawQuery.length === 0) {
        return;
      }
      // a change of sort field starts from that field's default direction
      const currentField = params.sort[0].split(' ')[0];
      const newField = sort.split(' ')[0] as SolrSortField;
      const newSort = (
        currentField === newField ? sort : `${newField} ${solrDefaultSortDirection[newField]}`
      ) as SolrSort;
      void setParams({ sort: normalizeSolrSort([newSort]), p: 1 });
    },
    [params.sort, rawQuery, setParams],
  );

  const onPerPageChange = useCallback(
    (numPerPage: NumPerPageType) => {
      // explicit user action — the only path that writes the persisted preference
      setNumPerPage(numPerPage);
      void setParams({ rows: numPerPage, p: 1 });
    },
    [setNumPerPage, setParams],
  );

  // Facet submissions can add dynamic companion params (fq_author, ...), which
  // nuqs cannot write — navigate through the router with the full param set
  const onFacetSubmission = useCallback(
    (queryUpdates: Partial<IADSApiSearchParams>) => {
      clearSelectedDocs();
      const search = makeSearchParams({ ...params, ...queryUpdates, p: 1 });
      void router.push({ pathname: router.pathname, search }, null, { scroll: false, shallow: true });
    },
    [clearSelectedDocs, params, router],
  );

  const onToggleHighlights = useCallback(() => {
    void setParams({ showHighlights: !showHighlights });
  }, [setParams, showHighlights]);

  return {
    params,
    searchParams,
    facetParams,
    start,
    showHighlights,
    results,
    handlers: {
      onSubmit,
      onSortChange,
      onPerPageChange,
      onFacetSubmission,
      onToggleHighlights,
    },
  };
};
