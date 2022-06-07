import { OverviewPageContainer, VizPageLayout } from '@components';
import { NextPage } from 'next';
import { makeSearchParams, parseQueryFromUrl } from '@utils';
import { IADSApiSearchParams } from '@api';
import { FacetField } from '@components/Visualizations/types';
import { useRouter } from 'next/router';
import { getQueryWithCondition } from '@components/Visualizations/utils';

const OverviewPage: NextPage = () => {
  const router = useRouter();

  const { qid: _qid, ...originalQuery } = parseQueryFromUrl<{ qid: string }>(router.query);

  const { qid, p, ...query } = parseQueryFromUrl<{ qid: string }>(router.query, { sortPostfix: 'id asc' });

  const bibsQuery: IADSApiSearchParams = qid ? { q: `docs(${qid})`, sort: ['id asc'] } : query;

  const handleApplyQueryCondition = (facet: FacetField, cond: string) => {
    const q = getQueryWithCondition(originalQuery.q, facet, cond);
    const newQuery = { ...originalQuery, q };
    void router.push({ pathname: '/search', query: makeSearchParams(newQuery) });
  };

  return (
    <div>
      <VizPageLayout
        vizPage="overview"
        from={{ pathname: '/search', query: makeSearchParams(originalQuery) }}
      ></VizPageLayout>
      <OverviewPageContainer query={bibsQuery} onApplyQueryCondition={handleApplyQueryCondition} />
    </div>
  );
};

export default OverviewPage;
