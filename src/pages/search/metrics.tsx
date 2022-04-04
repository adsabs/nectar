import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@chakra-ui/react';
import { Metrics, VizPageLayout } from '@components';
import { parseQueryFromUrl } from '@utils';
import { useGetMetricsMult } from '@_api/metrics';
import { useSearch } from '@_api/search';
import { getSearchParams } from '@_api/search/models';
import axios from 'axios';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';

const MetricsPage: NextPage = () => {
  const router = useRouter();

  const limit = 7000;

  const { qid, p, ...query } = router.query;

  // query to search all docs from original query
  const { data: queryData, refetch: refetchByQuery } = useSearch(
    getSearchParams({ ...parseQueryFromUrl(query), rows: limit }),
    {
      enabled: false,
    },
  );

  // query to get docs from vault (qid)
  const { data: vaultData, refetch: refetchByQid } = useSearch(getSearchParams({ q: `docs(${qid as string})` }), {
    enabled: false,
  });

  const bibcodes = useMemo(
    // prevent refetch metrics
    () => (qid ? vaultData?.docs?.map((doc) => doc.bibcode) : queryData?.docs?.map((doc) => doc.bibcode)),
    [vaultData, queryData],
  );

  // query to get metrics
  const {
    data: metricsData,
    refetch: refetchMetrics,
    isError: isErrorMetrics,
    error: errorMetrics,
  } = useGetMetricsMult(bibcodes, { enabled: false });

  useEffect(() => {
    if (qid) {
      // if has qid, use qid to get set of bibcodes
      void refetchByQid();
    } else if (query.q) {
      // if no qid, use query to get set of bibcodes
      void refetchByQuery();
    }
  }, [router]);

  useEffect(() => {
    void refetchMetrics();
  }, [bibcodes]);

  return (
    <div>
      <VizPageLayout vizPage="metrics" from={{ pathname: '/search', query: { ...query, p } }}>
        {isErrorMetrics && (
          <Alert status="error" my={5}>
            <AlertIcon />
            <AlertTitle mr={2}>Error!</AlertTitle>
            <AlertDescription>{axios.isAxiosError(errorMetrics) && errorMetrics.message}</AlertDescription>
          </Alert>
        )}
        {metricsData && (
          <Box my={5}>
            <Metrics metrics={metricsData} isAbstract={false} />
          </Box>
        )}
      </VizPageLayout>
    </div>
  );
};

export default MetricsPage;
