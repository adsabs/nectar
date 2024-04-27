import { PaperNetworkPageContainer, VizPageLayout } from '@/components';
import { makeSearchParams, parseQueryFromUrl } from '@/utils';
import { NextPage } from 'next';
import { useRouter } from 'next/router';

const PaperMetworkPage: NextPage = () => {
  const router = useRouter();

  // get original query q, used to 'navigate back' to the original search
  const { qid, ...originalQuery } = parseQueryFromUrl<{ qid: string }>(router.asPath);

  // get the new query q that will be used to fetch paper network
  // this could be the qid or the modified original query
  const { p, ...query } = originalQuery;
  const newQuery = qid ? { ...query, q: `docs(${qid})` } : query;

  return (
    <div>
      <VizPageLayout vizPage="paper_network" from={{ pathname: '/search', query: makeSearchParams(originalQuery) }}>
        <PaperNetworkPageContainer query={newQuery} />
      </VizPageLayout>
    </div>
  );
};

export default PaperMetworkPage;
export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
