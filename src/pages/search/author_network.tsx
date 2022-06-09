import { VizPageLayout } from '@components';
import { NextPage } from 'next';
import { useRouter } from 'next/router';

export const AuthorNetworkPage: NextPage = () => {
  const router = useRouter();

  const { qid, p, ...query } = router.query;

  return (
    <div>
      <VizPageLayout vizPage="author_network" from={{ pathname: '/search', query: { ...query, p } }}></VizPageLayout>
    </div>
  );
};

export default AuthorNetworkPage;
