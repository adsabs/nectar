import { IADSApiSearchParams, IDocsEntity } from '@api';
import { Stack } from '@chakra-ui/layout';
import { SimpleResultList } from '@components';
import { IPaginationProps, Pagination } from '@components/ResultList/Pagination';
import { calculatePage, IUsePaginationProps, usePagination } from '@components/ResultList/Pagination/usePagination';
import { SearchQueryLink } from '@components/SearchQueryLink';
import { APP_DEFAULTS } from '@config';
import { noop, parseNumberAndClamp, parseQueryFromUrl } from '@utils';
import { useRouter } from 'next/router';
import qs from 'qs';
import { ReactElement, useEffect } from 'react';
import { EffectReducer, useEffectReducer } from 'use-effect-reducer';
export interface IAbstractRefListProps {
  doc: IDocsEntity;
  docs: IDocsEntity[];
  searchLinkParams: IADSApiSearchParams;
  totalResults: IPaginationProps['totalResults'];
  onPageChange: (start: number) => void;
}

export const AbstractRefList = (props: IAbstractRefListProps): ReactElement => {
  const { doc, docs, onPageChange = noop, totalResults, searchLinkParams } = props;
  const router = useRouter();

  const { getPaginationProps } = usePaginationRouter({ numFound: totalResults, start: searchLinkParams.start });
  const pagination = getPaginationProps();

  // read incoming page from router on doc change
  useEffect(() => pagination.dispatch({ type: 'SET_PAGE', payload: parseNumberAndClamp(router.query.p, 1) }), [doc]);

  // call our page change handler on changes to pagination
  useEffect(() => onPageChange(pagination.startIndex), [pagination.startIndex]);

  return (
    <Stack direction="column" spacing={1} mt={1} w="full">
      <SearchQueryLink params={searchLinkParams}>
        <>View as search results</>
      </SearchQueryLink>
      <SimpleResultList docs={docs} hideCheckboxes={true} indexStart={pagination.startIndex} />
      <Pagination totalResults={totalResults} hidePerPageSelect {...pagination} />
    </Stack>
  );
};

const reducer: EffectReducer<
  { page: number; search: string },
  { type: 'PAGINATE'; payload: number } | { type: 'SEARCH'; payload: string },
  { type: 'updateUrl'; search: string }
> = (state, event, exec) => {
  if (event.type === 'PAGINATE' && state.page !== event.payload) {
    const search = `p=${event.payload}`;
    exec({ type: 'updateUrl', search });
    return { page: event.payload, search };
  }

  if (event.type === 'SEARCH' && state.search !== event.payload) {
    const { p: page } = parseQueryFromUrl(qs.parse(event.payload));
    return { page, search: event.payload };
  }

  return state;
};

const getInitialState = (start: number) => {
  const page = calculatePage(start, APP_DEFAULTS.PER_PAGE_OPTIONS[0]);
  return { page, search: `p=${page}` };
};

const usePaginationRouter = (props: IUsePaginationProps & { start: number }) => {
  const { start, ...paginationProps } = props;
  const router = useRouter();
  const [state, dispatch] = useEffectReducer(reducer, getInitialState(start), {
    updateUrl: ({ search }) =>
      void router.push(
        { pathname: router.pathname, search },
        { pathname: router.asPath.split('?')[0], search },
        { shallow: true },
      ),
  });

  const pagination = usePagination({
    ...paginationProps,
    page: state.page,
    onStateChange: (_, { page }) => {
      dispatch({ type: 'PAGINATE', payload: page });
    },
  });

  useEffect(() => {
    router.beforePopState(({ url }) => {
      if (url.startsWith('/abs') && url.indexOf('?') > -1) {
        dispatch({ type: 'SEARCH', payload: url.split('?')[1] });
        return true;
      }
      return false;
    });
    return () => router.beforePopState(() => true);
  }, []);

  return pagination;
};
