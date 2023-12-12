import { Bibcode, IADSApiSearchParams, useGetMetrics } from '@api';
import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, CircularProgress, Text } from '@chakra-ui/react';
import { CustomInfoMessage, MetricsPane } from '@components';
import { useBatchedSearch } from '@lib/useBatchedSearch';
import axios from 'axios';

interface IMetricsPageProps {
  query: IADSApiSearchParams;
}

const BATCH_SIZE = 1000;
const BATCHES = 7;

// This layer fetches the bibcodes
export const MetricsPageContainer = ({ query }: IMetricsPageProps) => {
  const { data, progress } = useBatchedSearch<string>(
    { rows: BATCH_SIZE, fl: ['bibcode'], ...query },
    { batches: BATCHES, transformResponses: (res) => res.response.docs.map((d) => d.bibcode) },
  );

  return data ? (
    <MetricsComponent bibcodes={data?.docs ?? []} />
  ) : (
    <Box my={5}>
      <Text my={5}>Fetching records</Text>
      <CircularProgress value={progress} max={100 - 100 / (BATCHES - 1)} />
    </Box>
  );
};

// This layer fetches the metrics from bibcodes
const MetricsComponent = ({ bibcodes }: { bibcodes: Bibcode[] }) => {
  // query to get metrics
  const {
    data: metricsData,
    isError: isErrorMetrics,
    error: errorMetrics,
    isLoading,
  } = useGetMetrics(bibcodes, { enabled: bibcodes && bibcodes.length > 0 });

  return (
    <Box my={5}>
      {bibcodes && bibcodes.length > 0 ? (
        <>
          {/* No metrics warning or Fetching error */}
          {isErrorMetrics && (
            <>
              {errorMetrics instanceof Error && errorMetrics.message.startsWith('No data available') ? (
                <CustomInfoMessage status="info" title="Metrics not available" description={errorMetrics.message} />
              ) : (
                <Alert status="error" my={5}>
                  <AlertIcon />
                  <AlertTitle mr={2}>Error fetching metrics!</AlertTitle>
                  <AlertDescription>{axios.isAxiosError(errorMetrics) && errorMetrics.message}</AlertDescription>
                </Alert>
              )}
            </>
          )}
          {/* Successfully fetched metrics */}
          {!isErrorMetrics && (
            <>
              <Text my={5}>
                {isLoading ? 'Loading' : 'Showing'} metrics for <b>{bibcodes.length.toLocaleString()}</b> records
              </Text>
              {isLoading && <CircularProgress isIndeterminate />}
              {metricsData && <MetricsPane metrics={metricsData} isAbstract={false} bibcodes={bibcodes} />}
            </>
          )}
        </>
      ) : null}
    </Box>
  );
};
