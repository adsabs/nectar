import { IADSApiSearchParams, useSearch } from '@api';
import { calculatePagination, PaginationResult, usePagination } from '@components/ResultList/Pagination/usePagination';
import { APP_DEFAULTS } from '@config';
import { AppState, useStore } from '@store';
import { NumPerPageType } from '@types';
import { makeSearchParams, parseQueryFromUrl } from '@utils';
import { useRouter } from 'next/router';
import qs from 'qs';
import { equals, mergeRight, omit, pick } from 'ramda';
import { useEffect, useMemo } from 'react';
import { EffectReducer, useEffectReducer } from 'use-effect-reducer';
import { useIsClient } from './useIsClient';

interface ISearchState {
  query: IADSApiSearchParams;
  numPerPage: NumPerPageType;
  search: string;
  pagination: Pick<PaginationResult, 'startIndex' | 'page'>;
}
type SearchEvent =
  | { type: 'SET_QUERY'; payload: ISearchState['query'] }
  | { type: 'SET_NUMPERPAGE'; payload: ISearchState['numPerPage'] }
  | { type: 'SET_PAGINATION'; payload: ISearchState['pagination'] }
  | { type: 'SET_SEARCH'; payload: ISearchState['search'] };

type SearchEffect = { type: 'updateUrl'; search: string };

const cleanParams = omit(['fl', 'start', 'rows']);
const pickPagParams = pick(['page', 'startIndex']);
const noFl = omit(['fl']);

const reducer: EffectReducer<ISearchState, SearchEvent, SearchEffect> = (state, event, exec) => {
  switch (event.type) {
    /**
     * Event should be triggered when the latest query is submitted (from context)
     * This will merge the incoming query and update both url params and pagination
     */
    case 'SET_QUERY':
      if (!equals(noFl(state.query), noFl(event.payload))) {
        const query = mergeRight(state.query, { ...event.payload, start: 0 });
        const search = makeSearchParams({ ...cleanParams(query), p: 1 });
        const pagination = pickPagParams(
          calculatePagination({
            numPerPage: state.numPerPage,
            page: 1,
          }),
        );
        exec({ type: 'updateUrl', search });
        return { ...state, search, query, pagination };
      }
      return state;

    /**
     * On pagination update, we update url params
     */
    case 'SET_PAGINATION':
      if (!equals(state.pagination, event.payload)) {
        const query = mergeRight(state.query, { start: event.payload.startIndex });
        const search = makeSearchParams({ ...cleanParams(query), p: event.payload.page });

        exec({ type: 'updateUrl', search });
        return {
          ...state,
          pagination: event.payload,
          query,
          search,
        };
      }
      return state;

    // update and submit query on numPerPage change
    case 'SET_NUMPERPAGE':
      if (state.numPerPage !== event.payload) {
        const query = mergeRight(state.query, { rows: event.payload });
        return { ...state, query, numPerPage: event.payload };
      }
      return state;

    /**
     * Triggered during a popstate transition
     * We get the url search params, which are parsed and used to build out a new state
     * Query is merged (possibly not what we want)
     */
    case 'SET_SEARCH':
      if (state.search !== event.payload) {
        const parsed = parseQueryFromUrl(qs.parse(event.payload));
        const pagination = pickPagParams(
          calculatePagination({
            numPerPage: state.numPerPage,
            page: parsed.p,
          }),
        );
        const query = mergeRight(state.query, { ...parsed, start: pagination.startIndex });

        return {
          ...state,
          pagination,
          query,
          search: event.payload,
        };
      }
      return state;

    default:
      return state;
  }
};

// generate initialy state based on incoming query
const getInitialState = (query: IADSApiSearchParams): ISearchState => {
  return {
    query,
    numPerPage: APP_DEFAULTS.PER_PAGE_OPTIONS[0],
    search: makeSearchParams(cleanParams(query)),
    pagination: calculatePagination({ numFound: 0, numPerPage: APP_DEFAULTS.PER_PAGE_OPTIONS[0], page: 1 }),
  };
};

export interface IUseSearchControllerProps {
  ssrPage: number;
}

// selectors
const setQuerySelector = (state: AppState) => state.setQuery;
const setDocsSelector = (state: AppState) => state.setDocs;

export const useSearchController = ({
  ssrPage,
}: IUseSearchControllerProps): [ReturnType<typeof useSearch>, ReturnType<typeof usePagination>] => {
  const router = useRouter();
  const setQuery = useStore(setQuerySelector);
  const setDocs = useStore(setDocsSelector);
  const isClient = useIsClient();
  const query = useStore((state) => state.latestQuery);
  const initialState = useMemo(() => getInitialState(query), []);

  // Main logic reducer (w/side effects)
  const [state, dispatch] = useEffectReducer(reducer, initialState, {
    // pushes a new search to the url (shallow update)
    updateUrl: (_, { search }) =>
      void router.push({ pathname: router.pathname, search }, null, { shallow: true, scroll: true }),
  });

  // triggers an update to state when global store query is submitted
  useEffect(() => dispatch({ type: 'SET_QUERY', payload: query }), [query]);

  // subscribe to history changes and update store with new url
  useEffect(() => {
    router.beforePopState(({ url, options }) => {
      if (url.startsWith('/search') && url.indexOf('?') > -1 && options.shallow) {
        dispatch({ type: 'SET_SEARCH', payload: url.split('?')[1] });
        return false;
      }
      return true;
    });
    return () => router.beforePopState(() => true);
  }, []);

  const result = useSearch(state.query);

  // update store on data change
  useEffect(() => {
    if (result.data && result.data.docs.length > 0) {
      setDocs(result.data.docs.map((d) => d.bibcode));
    }
  }, [result.data]);

  // on update to query, push those changes to the store
  useEffect(() => {
    setQuery(state.query);
  }, [state.query]);

  const pagination = usePagination({
    numFound: result.data?.numFound,

    // makes pagination controlled via page prop
    page: isClient ? state.pagination.page : ssrPage,

    // trigger updates to store when state changes
    onStateChange: (pagination, { numPerPage }) => {
      dispatch({ type: 'SET_PAGINATION', payload: pickPagParams(pagination) });
      dispatch({ type: 'SET_NUMPERPAGE', payload: numPerPage });
    },
  });

  return [result, pagination];
};
