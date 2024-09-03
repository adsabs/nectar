import { Box } from '@chakra-ui/react';
import { InferGetServerSidePropsType, NextPage } from 'next';
import { useMemo } from 'react';

import { BasicStatsKey, CitationsStatsKey, MetricsResponseKey, useGetMetrics } from '@/api';
import { LoadingMessage, MetricsPane } from '@/components';
import { AbsLayout } from '@/components/Layout/AbsLayout';
import { withDetailsPage } from '@/hocs/withDetailsPage';

const MetricsPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = (props) => {
  const { doc, error: pageError, params: pageParams } = props;

  // Fetch metrics data
  const {
    data: metrics,
    isError,
    isLoading,
    isSuccess,
  } = useGetMetrics(doc?.bibcode, {
    enabled: !!doc?.bibcode,
    keepPreviousData: true,
  });

  // Memoize derived state values for better performance
  const hasCitations = useMemo(
    () => isSuccess && metrics?.[MetricsResponseKey.CS]?.[CitationsStatsKey.TNC] > 0,
    [isSuccess, metrics],
  );

  const hasReads = useMemo(
    () => isSuccess && metrics?.[MetricsResponseKey.BS]?.[BasicStatsKey.TNR] > 0,
    [isSuccess, metrics],
  );

  // Early return for error state
  if (isError) {
    return (
      <AbsLayout doc={doc} titleDescription="Metrics for" label="Metrics" error={pageError} params={pageParams}>
        <Box mt={5} fontSize="xl">
          Unable to fetch metrics
        </Box>
      </AbsLayout>
    );
  }

  // Early return for no data state
  if (!isLoading && !hasCitations && !hasReads) {
    return (
      <AbsLayout doc={doc} titleDescription="Metrics for" label="Metrics" error={pageError} params={pageParams}>
        <Box mt={5} fontSize="xl">
          No metrics data
        </Box>
      </AbsLayout>
    );
  }

  return (
    <AbsLayout doc={doc} titleDescription="Metrics for" label="Metrics" error={pageError} params={pageParams}>
      {isLoading ? (
        <LoadingMessage message="Loading metrics..." />
      ) : (
        <MetricsPane metrics={metrics} isAbstract={true} />
      )}
    </AbsLayout>
  );
};

export default MetricsPage;

export const getServerSideProps = withDetailsPage;
