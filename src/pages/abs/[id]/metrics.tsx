import {
  BasicStatsKey,
  CitationsStatsKey,
  fetchMetrics,
  getMetricsParams,
  IDocsEntity,
  metricsKeys,
  MetricsResponseKey,
  useGetAbstract,
  useGetMetrics,
} from '@/api';
import { Box } from '@chakra-ui/react';
import { LoadingMessage, MetricsPane } from '@/components';
import { AbsLayout } from '@/components/Layout/AbsLayout';
import { GetServerSideProps, NextPage } from 'next';
import { composeNextGSSP } from '@/ssr-utils';
import { path } from 'ramda';
import { useRouter } from 'next/router';
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { logger } from '@/logger';
import { parseAPIError } from '@/utils';

const MetricsPage: NextPage = () => {
  const router = useRouter();
  const { data } = useGetAbstract({ id: router.query.id as string });
  const doc = path<IDocsEntity>(['docs', 0], data);

  const {
    data: metrics,
    isError,
    isLoading,
    isSuccess,
  } = useGetMetrics(doc?.bibcode, { enabled: !!doc?.bibcode, keepPreviousData: true });

  const hasCitations = isSuccess && metrics && metrics[MetricsResponseKey.CS][CitationsStatsKey.TNC] > 0;
  const hasReads = isSuccess && metrics && metrics[MetricsResponseKey.BS][BasicStatsKey.TNR] > 0;

  return (
    <AbsLayout doc={doc} titleDescription="Metrics for" label="Metrics">
      {isError && (
        <Box mt={5} fontSize="xl">
          Unable to fetch metrics
        </Box>
      )}
      {!isError && !isLoading && !hasCitations && !hasReads ? (
        <Box mt={5} fontSize="xl">
          No metrics data
        </Box>
      ) : (
        <>{isLoading ? <LoadingMessage message="Loading" /> : <MetricsPane metrics={metrics} isAbstract={true} />} </>
      )}
    </AbsLayout>
  );
};

export default MetricsPage;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx) => {
  try {
    const { id } = ctx.params as { id: string };
    const queryClient = new QueryClient();
    await queryClient.prefetchQuery({
      queryKey: metricsKeys.primary([id]),
      queryFn: fetchMetrics,
      meta: { params: getMetricsParams([id]) },
    });
    return {
      props: {
        dehydratedState: dehydrate(queryClient),
      },
    };
  } catch (err) {
    logger.error({ err, url: ctx.resolvedUrl }, 'Error fetching details');
    return {
      props: {
        pageError: parseAPIError(err),
      },
    };
  }
});
