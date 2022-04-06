import { ReactElement, useEffect, useMemo } from 'react';
import { useQueries } from 'react-query';
import { fetchSearch } from '@_api/search';
import { parseQueryFromUrl } from '@utils';
import { IADSApiSearchResponse } from '@api';
import { useGetMultMetrics } from '@_api/metrics';
import { Metrics } from '@components';
import { Alert, AlertDescription, AlertIcon, AlertTitle, Box } from '@chakra-ui/react';
import axios from 'axios';

interface IMetricsPageProps {
  query: { [key: string]: string | string[] };
  qid?: string;
  recordsToGet: number;
}

// This layer fetches the bibcodes
export const MetricsPageContainer = ({ query, qid, recordsToGet }: IMetricsPageProps): ReactElement => {
  const starts = useMemo(() => {
    let remainsToFetch = recordsToGet;
    const arr = [];
    let start = 0;
    while (remainsToFetch > 0) {
      arr.push(start);
      start += 1000;
      remainsToFetch -= 1000;
    }
    return arr;
  }, [recordsToGet]);

  // parallel queries to get bobcodes
  const fetchBibsQueries = useQueries(
    starts.map((start) => {
      const params = qid
        ? { q: `docs(${qid})`, start: start, rows: 1000, fl: ['bibcode'] }
        : { ...parseQueryFromUrl(query), start: start, rows: 1000, fl: ['bibcode'] };
      return {
        queryKey: ['search/bibcodes', start],
        queryFn: fetchSearch,
        meta: { params },
        select: (data: IADSApiSearchResponse) => data.response,
      };
    }),
  );

  const bibcodes = useMemo(() => {
    if (fetchBibsQueries.length > 0) {
      const bibs: string[] = [];
      fetchBibsQueries.map(({ data }) => {
        data?.docs?.forEach((doc) => bibs.push(doc.bibcode));
      });
      return bibs;
    }
  }, [fetchBibsQueries]);

  return <MetricsComponent bibcodes={bibcodes} />;
};

// This layer fetches the metrics from bibcodes
const MetricsComponent = ({ bibcodes }: { bibcodes: string[] }): ReactElement => {
  const isSimple = useMemo(() => {
    return bibcodes && bibcodes.length > 6000;
  }, [bibcodes]);

  // query to get metrics
  const {
    data: metricsData,
    refetch: fetchMetrics,
    isError: isErrorMetrics,
    error: errorMetrics,
  } = useGetMultMetrics({ bibcodes, isSimple }, { enabled: false });

  useEffect(() => {
    if (bibcodes && bibcodes.length > 0) {
      void fetchMetrics();
    }
  }, [bibcodes]);

  return (
    <>
      {isErrorMetrics && (
        <Alert status="error" my={5}>
          <AlertIcon />
          <AlertTitle mr={2}>Error!</AlertTitle>
          <AlertDescription>{axios.isAxiosError(errorMetrics) && errorMetrics.message}</AlertDescription>
        </Alert>
      )}
      {metricsData && (
        <Box my={5}>
          <Metrics metrics={metricsData} isAbstract={false} bibcodes={isSimple ? bibcodes : undefined} />
        </Box>
      )}
    </>
  );
};
