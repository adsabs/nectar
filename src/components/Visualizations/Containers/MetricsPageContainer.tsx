import { Bibcode, IADSApiSearchParams, useGetMetrics } from '@api';
import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, CircularProgress, Text } from '@chakra-ui/react';
import { Metrics } from '@components';
import { useBatchedSearch } from '@hooks/useBatchedSearch';
import axios from 'axios';
import { ReactElement } from 'react';

interface IMetricsPageProps {
  query: IADSApiSearchParams;
}

const BATCH_SIZE = 1000;
const BATCHES = 7;

// This layer fetches the bibcodes
export const MetricsPageContainer = ({ query }: IMetricsPageProps): ReactElement => {
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
const MetricsComponent = ({ bibcodes }: { bibcodes: Bibcode[] }): ReactElement => {
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
                <Alert
                  status="info"
                  my={5}
                  variant="subtle"
                  flexDirection="column"
                  justifyContent="center"
                  height="200px"
                  backgroundColor="transparent"
                >
                  <AlertIcon boxSize="40px" />
                  <AlertTitle mt={4} mb={1} fontSize="lg">
                    Metrics not available
                  </AlertTitle>
                  <AlertDescription>{errorMetrics.message}</AlertDescription>
                </Alert>
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
              {metricsData && <Metrics metrics={metricsData} isAbstract={false} bibcodes={bibcodes} />}
            </>
          )}
        </>
      ) : null}
    </Box>
  );
};
