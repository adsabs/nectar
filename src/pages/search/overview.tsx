import { OverviewPageContainer, VizPageLayout } from '@components';
import { GetServerSideProps, NextPage } from 'next';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@chakra-ui/react';
import { parseQueryFromUrl, setupApiSSR } from '@utils';
import { dehydrate, QueryClient } from 'react-query';
import {
  getSearchFacetCitationsParams,
  getSearchFacetReadsParams,
  getSearchFacetYearsParams,
  IADSApiSearchParams,
  searchKeys,
} from '@api';
import axios from 'axios';
import qs from 'qs';

interface IOverviewProps {
  originalQuery: IADSApiSearchParams;
  bibsQuery: IADSApiSearchParams;
  error?: string;
}
const OverviewPage: NextPage<IOverviewProps> = ({ originalQuery, bibsQuery, error }) => {
  return (
    <div>
      <VizPageLayout
        vizPage="overview"
        from={{ pathname: '/search', query: qs.stringify(originalQuery, { arrayFormat: 'comma' }) }}
      ></VizPageLayout>
      {error ? (
        <Alert status="error" my={5}>
          <AlertIcon />
          <AlertTitle mr={2}>Error fetching records!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <OverviewPageContainer query={bibsQuery} />
      )}
    </div>
  );
};

const getCleanedParams = (params: IADSApiSearchParams) => {
  // omit fields from queryKey
  const { fl, ...cleanParams } = params;
  return cleanParams;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  setupApiSSR(ctx);
  const { fetchSearch } = await import('@api');
  const { qid: _qid, ...originalQuery } = ctx.query;
  const { qid, p, ...query } = parseQueryFromUrl<{ qid: string }>(ctx.query, { sortPostfix: 'id asc' });

  const queryClient = new QueryClient();

  try {
    // prefetch years, reads, citations graph data for the query
    const params: IADSApiSearchParams = qid ? { q: `docs(${qid})`, sort: ['id asc'] } : query;

    const years_params: IADSApiSearchParams = getSearchFacetYearsParams(params);

    const citations_params: IADSApiSearchParams = getSearchFacetCitationsParams(params);

    const reads_params: IADSApiSearchParams = getSearchFacetReadsParams(params);

    await queryClient.prefetchQuery({
      queryKey: searchKeys.facet(getCleanedParams(years_params)),
      queryFn: fetchSearch,
      meta: { params: years_params },
    });

    await queryClient.prefetchQuery({
      queryKey: searchKeys.facet(getCleanedParams(citations_params)),
      queryFn: fetchSearch,
      meta: { params: citations_params },
    });

    await queryClient.prefetchQuery({
      queryKey: searchKeys.facet(getCleanedParams(reads_params)),
      queryFn: fetchSearch,
      meta: { params: reads_params },
    });

    return {
      props: {
        originalQuery,
        bibsQuery: params,
        dehydratedState: dehydrate(queryClient),
      },
    };
  } catch (e) {
    return {
      props: {
        error: axios.isAxiosError(e) ? e.message : 'Unable to fetch data',
      },
    };
  }
};

export default OverviewPage;
