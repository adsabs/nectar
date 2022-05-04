import { VizPageLayout } from '@components';
import { NextPage } from 'next';
import { useRouter } from 'next/router';

const ResultsGraphPage: NextPage = () => {
  const router = useRouter();

  const { qid, p, ...query } = router.query;

  return (
    <div>
      <VizPageLayout vizPage="results_graph" from={{ pathname: '/search', query: { ...query, p } }}></VizPageLayout>
    </div>
  );
};

export default ResultsGraphPage;
