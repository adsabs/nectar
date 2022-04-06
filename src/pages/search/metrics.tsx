import { Text } from '@chakra-ui/react';
import { VizPageLayout } from '@components';
import { MetricsPageContainer } from '@components';
import { parseQueryFromUrl } from '@utils';
import { useSearch } from '@_api/search';
import { getSearchParams } from '@_api/search/models';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const MetricsPage: NextPage = () => {
  const router = useRouter();

  const limit = 7000;

  const [recordsToGet, setRecordsToGet] = useState(0);

  const { qid, p, ...query } = router.query;

  // query to get docs count from original query
  const { data: countByQuery, refetch: fetchRecCountByQuery } = useSearch(
    getSearchParams({ ...parseQueryFromUrl(query), rows: 1 }),
    {
      enabled: false,
    },
  );

  // query to get docs count from vault (qid)
  const { data: countByQid, refetch: fetchRecCountByQid } = useSearch(
    getSearchParams({ q: `docs(${qid as string})` }),
    {
      enabled: false,
    },
  );

  // new query
  useEffect(() => {
    if (qid) {
      // if has qid, use qid to get set of bibcodes
      void fetchRecCountByQid();
    } else if (query.q) {
      // if no qid, use query to get set of bibcodes
      void fetchRecCountByQuery();
    }
  }, [router]);

  useEffect(() => {
    const numFound = qid ? countByQid?.numFound : countByQuery?.numFound;
    if (typeof numFound === 'number') {
      setRecordsToGet(Math.min(numFound, limit));
    }
  }, [countByQuery, countByQid]);

  return (
    <VizPageLayout vizPage="metrics" from={{ pathname: '/search', query: { ...query, p } }}>
      <Text my={5}>
        Showing metrics for <b>{recordsToGet}</b> records
      </Text>
      <MetricsPageContainer query={query} qid={qid as string} recordsToGet={recordsToGet} />
    </VizPageLayout>
  );
};

export default MetricsPage;
