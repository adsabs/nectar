import { VizPageLayout } from '@components';
import { NextPage } from 'next';
import { useRouter } from 'next/router';

const PaperMetworkPage: NextPage = () => {
  const router = useRouter();

  const { qid, p, ...query } = router.query;

  return (
    <div>
      <VizPageLayout vizPage="paper_network" from={{ pathname: '/search', query: { ...query, p } }}></VizPageLayout>
    </div>
  );
};

export default PaperMetworkPage;
