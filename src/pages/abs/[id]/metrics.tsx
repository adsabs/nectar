import {
  BasicStatsKey,
  CitationsStatsKey,
  fetchMetrics,
  getMetricsParams,
  IADSApiSearchResponse,
  metricsKeys,
  MetricsResponseKey,
  searchKeys,
  useGetMetrics,
} from '@api';
import { Box } from '@chakra-ui/react';
import { MetricsPane } from '@components';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { withDetailsPage } from '@hocs/withDetailsPage';
import { useGetAbstractDoc } from '@lib/useGetAbstractDoc';
import { normalizeURLParams, unwrapStringValue } from '@utils';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { dehydrate, DehydratedState, hydrate, QueryClient } from '@tanstack/react-query';
import { composeNextGSSP } from '@ssr-utils';

interface IMetricsPageProps {
  id: string;
  error?: {
    status?: string;
    message?: string;
  };
}

const MetricsPage: NextPage<IMetricsPageProps> = (props: IMetricsPageProps) => {
  const { id } = props;

  const doc = useGetAbstractDoc(id);

  const { data: metrics, isError, isSuccess } = useGetMetrics(doc.bibcode, { keepPreviousData: true });

  const hasCitations = isSuccess && metrics && metrics[MetricsResponseKey.CS][CitationsStatsKey.TNC] > 0;
  const hasReads = isSuccess && metrics && metrics[MetricsResponseKey.BS][BasicStatsKey.TNR] > 0;
  const title = unwrapStringValue(doc?.title);

  return (
    <AbsLayout doc={doc} titleDescription="Metrics for">
      <Head>
        <title>NASA Science Explorer - Metrics - {title}</title>
      </Head>
      {isError && (
        <Box mt={5} fontSize="xl">
          Unable to fetch metrics
        </Box>
      )}
      {!isError && !hasCitations && !hasReads ? (
        <Box mt={5} fontSize="xl">
          No metrics data
        </Box>
      ) : (
        <MetricsPane metrics={metrics} isAbstract={true} />
      )}
    </AbsLayout>
  );
};

export default MetricsPage;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(withDetailsPage, async (ctx, state) => {
  const axios = (await import('axios')).default;
  const query = normalizeURLParams(ctx.query);

  try {
    const queryClient = new QueryClient();
    hydrate(queryClient, state.props?.dehydratedState as DehydratedState);
    const {
      response: {
        docs: [{ bibcode }],
      },
    } = queryClient.getQueryData<IADSApiSearchResponse>(searchKeys.abstract(query.id));

    const params = getMetricsParams([bibcode]);

    void (await queryClient.prefetchQuery({
      queryKey: metricsKeys.primary([bibcode]),
      queryFn: fetchMetrics,
      meta: { params },
    }));

    return {
      props: {
        dehydratedState: dehydrate(queryClient),
      },
    };
  } catch (e) {
    if (axios.isAxiosError(e) && e.response) {
      return {
        props: {
          error: {
            status: e.response.status,
            message: e.message,
          },
        },
      };
    }
    return {
      props: {
        error: {
          status: 500,
          message: 'Unknown server error',
        },
      },
    };
  }
});
