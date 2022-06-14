import { IADSApiSearchParams } from '@api';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@chakra-ui/react';
import { MetricsPageContainer, VizPageLayout } from '@components';
import { makeSearchParams, parseQueryFromUrl, setupApiSSR } from '@utils';
import axios from 'axios';
import { GetServerSideProps, NextPage } from 'next';

interface IMetricsProps {
  originalQuery: IADSApiSearchParams;
  bibsQuery: IADSApiSearchParams;
  error?: string;
}

const MetricsPage: NextPage<IMetricsProps> = (props) => {
  const { error, originalQuery, bibsQuery } = props;

  return (
    <VizPageLayout vizPage="metrics" from={{ pathname: '/search', query: makeSearchParams(originalQuery) }}>
      {error ? (
        <Alert status="error" my={5}>
          <AlertIcon />
          <AlertTitle mr={2}>Error fetching records!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <MetricsPageContainer query={bibsQuery} />
      )}
    </VizPageLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const BATCH_SIZE = 1000;
  setupApiSSR(ctx);
  const { qid: _qid, ...originalQuery } = ctx.query;
  const { qid = null, p, ...query } = parseQueryFromUrl<{ qid: string }>(ctx.query, { sortPostfix: 'id asc' });

  // TODO: figure out why this clears the cache on transition
  // const queryClient = new QueryClient();

  try {
    // prefetch bibcodes from query

    const params: IADSApiSearchParams = {
      rows: BATCH_SIZE,
      fl: ['bibcode'],
      ...(qid ? { q: `docs(${qid})`, sort: ['id asc'] } : query),
    };

    // await queryClient.prefetchInfiniteQuery({
    //   queryKey: searchKeys.infinite(params),
    //   queryFn: fetchSearchInfinite,
    //   meta: { params },
    // });

    // react-query infinite queries cannot be serialized by next, currently.
    // see https://github.com/tannerlinsley/react-query/issues/3301#issuecomment-1041374043
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    // const dehydratedState: DehydratedState = JSON.parse(JSON.stringify(dehydrate(queryClient)));

    return Promise.resolve({
      props: {
        originalQuery,
        bibsQuery: params,
        // dehydratedState,
      },
    });
  } catch (e) {
    return Promise.resolve({
      props: {
        error: axios.isAxiosError(e) ? e.message : 'Unable to fetch data',
      },
    });
  }
};

export default MetricsPage;
