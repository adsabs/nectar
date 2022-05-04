import { IADSApiSearchParams } from '@api';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@chakra-ui/react';
import { MetricsPageContainer, VizPageLayout } from '@components';
import { parseQueryFromUrl, setupApiSSR } from '@utils';
import { fetchSearchInfinite, searchKeys } from '@_api/search';
import axios from 'axios';
import { GetServerSideProps, NextPage } from 'next';
import qs from 'qs';
import { dehydrate, DehydratedState, QueryClient } from 'react-query';

interface IMetricsProps {
  query: IADSApiSearchParams;
  qid?: string;
  error?: string;
}

const MetricsPage: NextPage<IMetricsProps> = (props) => {
  const { qid, error, query } = props;

  return (
    <VizPageLayout
      vizPage="metrics"
      from={{ pathname: '/search', query: qs.stringify(query, { arrayFormat: 'comma' }) }}
    >
      {error ? (
        <Alert status="error" my={5}>
          <AlertIcon />
          <AlertTitle mr={2}>Error fetching records!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <MetricsPageContainer qid={qid} query={query} />
      )}
    </VizPageLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const BATCH_SIZE = 1000;
  setupApiSSR(ctx);
  const { fetchSearch } = await import('@_api/search');
  const { qid = null, p, ...query } = parseQueryFromUrl<{ qid: string }>(ctx.query, { sortPostfix: 'id asc' });

  const queryClient = new QueryClient();

  try {
    const params: IADSApiSearchParams = {
      rows: BATCH_SIZE,
      fl: ['bibcode'],
      ...(qid ? { q: `docs(${qid})`, sort: ['id asc'] } : query),
    };

    if (!qid) {
      // prefetch search query
      void (await queryClient.prefetchQuery({
        queryKey: searchKeys.primary(params),
        queryFn: fetchSearch,
        meta: { params },
      }));
    }

    // prefetch metrics query
    await queryClient.prefetchInfiniteQuery({
      queryKey: searchKeys.infinite(params),
      queryFn: fetchSearchInfinite,
      meta: { params },
    });

    // react-query infinite queries cannot be serialized by next, currently.
    // see https://github.com/tannerlinsley/react-query/issues/3301#issuecomment-1041374043
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const dehydratedState: DehydratedState = JSON.parse(JSON.stringify(dehydrate(queryClient)));

    return {
      props: {
        query,
        qid,
        dehydratedState,
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

export default MetricsPage;
