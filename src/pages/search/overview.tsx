import { getQueryWithCondition, OverviewPageContainer, VizPageLayout } from '@components';
import { NextPage } from 'next';
import { parseQueryFromUrl } from '@utils';
import { IADSApiSearchParams } from '@api';
import qs from 'qs';
import { FacetField } from '@components/Visualizations/types';
import { useRouter } from 'next/router';

const OverviewPage: NextPage = () => {
  const router = useRouter();

  const { qid: _qid, ...originalQuery } = parseQueryFromUrl<{ qid: string }>(router.query);

  const { qid, p, ...query } = parseQueryFromUrl<{ qid: string }>(router.query, { sortPostfix: 'id asc' });

  const bibsQuery: IADSApiSearchParams = qid ? { q: `docs(${qid})`, sort: ['id asc'] } : query;

  const handleApplyQueryCondition = (facet: FacetField, cond: string) => {
    const q = getQueryWithCondition(originalQuery.q, facet, cond);
    const newQuery = { ...originalQuery, q };
    void router.push({ pathname: '/search', query: qs.stringify(newQuery, { arrayFormat: 'comma' }) });
  };

  return (
    <div>
      <VizPageLayout
        vizPage="overview"
        from={{ pathname: '/search', query: qs.stringify(originalQuery, { arrayFormat: 'comma' }) }}
      ></VizPageLayout>
      <OverviewPageContainer query={bibsQuery} onApplyQueryCondition={handleApplyQueryCondition} />
    </div>
  );
};

export default OverviewPage;
