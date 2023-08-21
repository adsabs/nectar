import { IADSApiSearchParams } from '@api';
import { OverviewPageContainer, VizPageLayout } from '@components';
import { FacetField } from '@components/Visualizations/types';
import { getQueryWithCondition } from '@components/Visualizations/utils';
import { makeSearchParams, parseQueryFromUrl } from '@utils';
import { NextPage } from 'next';
import { useRouter } from 'next/router';

const OverviewPage: NextPage = () => {
  const router = useRouter();

  const { qid: _qid, ...originalQuery } = parseQueryFromUrl<{ qid: string }>(router.asPath);

  const { qid, p, ...query } = parseQueryFromUrl<{ qid: string }>(router.asPath, { sortPostfix: 'id asc' });

  const bibsQuery: IADSApiSearchParams = qid ? { q: `docs(${qid})`, sort: ['id asc'] } : query;

  const handleApplyQueryCondition = (facet: FacetField, cond: string) => {
    // Run new query by appending condition to the original query or to the qid
    const tmpQuery = qid ? `docs(${qid})` : originalQuery.q;
    const q = getQueryWithCondition(tmpQuery, facet, cond);
    void router.push({ pathname: '/search', search: makeSearchParams({ q }) });
  };

  return (
    <div>
      <VizPageLayout vizPage="overview" from={{ pathname: '/search', query: makeSearchParams(originalQuery) }}>
        <OverviewPageContainer query={bibsQuery} onApplyQueryCondition={handleApplyQueryCondition} />
      </VizPageLayout>
    </div>
  );
};

export default OverviewPage;
export { injectSessionGSSP as getServerSideProps } from '@ssr-utils';
