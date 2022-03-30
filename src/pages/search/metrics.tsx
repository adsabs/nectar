import { VizPageLayout } from '@components';
import { NextPage } from 'next';
import { useRouter } from 'next/router';

const MetricsPage: NextPage = () => {
  const router = useRouter();

  const limit = 7000;

  const { qid, p, ...query } = router.query;

  if (qid) {
    // if qid, use qid to get
  } else {
    // if no qid, use query
  }

  // const { data: metrics, isError, isSuccess, error } = useGetMetrics(docs, { keepPreviousData: true });

  return (
    <div>
      <VizPageLayout vizPage="metrics" from={{ pathname: '/search', query: { ...query, p } }}>
        {/* {isSuccess && <Metrics metrics={metrics as IADSApiMetricsResponse} isAbstract={false} />} */}
      </VizPageLayout>
    </div>
  );
};

export default MetricsPage;
