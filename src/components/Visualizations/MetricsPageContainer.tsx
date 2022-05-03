import { Bibcode, IADSApiSearchParams, useGetMetrics } from '@api';
import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, CircularProgress, Text } from '@chakra-ui/react';
import { Metrics } from '@components';
import { useBatchedSearch } from '@hooks/useBatchedSearch';
import axios from 'axios';
import { ReactElement } from 'react';

interface IMetricsPageProps {
  query: IADSApiSearchParams;
  qid?: string;
}

const BATCH_SIZE = 1000;
const BATCHES = 7;

// This layer fetches the bibcodes
export const MetricsPageContainer = ({ query, qid }: IMetricsPageProps): ReactElement => {
  // ----------- fetch bibcodes using useQueries (with prefetching) ----------------

  // const starts = useMemo(() => {
  //   let remainsToFetch = recordsToGet;
  //   const arr = [];
  //   let start = 0;
  //   while (remainsToFetch > 0) {
  //     arr.push(start);
  //     start += batchSize;
  //     remainsToFetch -= batchSize;
  //   }
  //   return arr;
  // }, [recordsToGet]);

  // parallel queries to get bibcodes
  // const fetchBibsQueries = useQueries(
  //   starts.map((start) => {
  //     const params: IADSApiSearchParams = qid
  //       ? { q: `docs(${qid})`, start: start, rows: batchSize, fl: ['bibcode'] }
  //       : { ...parseQueryFromUrlNoPage(query), start: start, rows: batchSize, fl: ['bibcode'] };
  //     return {
  //       queryKey: searchKeys.primary(params),
  //       queryFn: fetchSearch,
  //       meta: { params },
  //       select: (data: IADSApiSearchResponse) => data.response,
  //     };
  //   }),
  // );

  // const bibcodes = useMemo(() => {
  //   // update bibcodes only when all queries have finished
  //   if (
  //     fetchBibsQueries.length > 0 &&
  //     fetchBibsQueries.filter((query) => query.isLoading === false).length === fetchBibsQueries.length
  //   ) {
  //     const bibs: string[] = [];
  //     fetchBibsQueries.map(({ data }) => {
  //       data?.docs?.forEach((doc) => bibs.push(doc.bibcode));
  //     });
  //     return bibs;
  //   }
  // }, [fetchBibsQueries]);

  // -------------------------------------------

  const params: IADSApiSearchParams = qid ? { q: `docs(${qid})`, sort: ['id asc'] } : query;

  const { data, progress } = useBatchedSearch<string>(
    { rows: BATCH_SIZE, fl: ['bibcode'], ...params },
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
          {isErrorMetrics ? (
            <Alert status="error" my={5}>
              <AlertIcon />
              <AlertTitle mr={2}>Error fetching metrics!</AlertTitle>
              <AlertDescription>{axios.isAxiosError(errorMetrics) && errorMetrics.message}</AlertDescription>
            </Alert>
          ) : (
            <>
              <Text my={5}>
                {isLoading ? 'Loading' : 'Showing'} metrics for <b>{bibcodes.length}</b> records
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
