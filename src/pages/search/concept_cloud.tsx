import { VizPageLayout } from '@components';
import { NextPage } from 'next';
import { useRouter } from 'next/router';

const ConceptCloudPage: NextPage = () => {
  const router = useRouter();

  const { qid, p, ...query } = router.query;

  return (
    <div>
      <VizPageLayout vizPage="concept_cloud" from={{ pathname: '/search', query: { ...query, p } }}></VizPageLayout>
    </div>
  );
};

export default ConceptCloudPage;
