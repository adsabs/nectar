import { AuthorNetworkPageContainer, VizPageLayout } from '@/components';
import { makeSearchParams, parseQueryFromUrl } from '@/utils';
import { NextPage } from 'next';
import { useRouter } from 'next/router';

export const AuthorNetworkPage: NextPage = () => {
  const router = useRouter();

  // get original query q, used to 'navigate back' to the original search
  const { qid, ...originalQuery } = parseQueryFromUrl<{ qid: string }>(router.asPath);

  // get the new query q that will be used to fetch author network
  // this could be the qid or the modified original query
  const { p, ...query } = originalQuery;
  const newQuery = qid ? { ...query, q: `docs(${qid})` } : query;

  return (
    <div>
      <VizPageLayout vizPage="author_network" from={{ pathname: '/search', query: makeSearchParams(originalQuery) }}>
        <AuthorNetworkPageContainer query={newQuery} />
      </VizPageLayout>
    </div>
  );
};

export default AuthorNetworkPage;
export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
