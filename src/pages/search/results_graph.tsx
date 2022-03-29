import { VizPageLayout } from '@components';
import { NextPage } from 'next';

import { Url } from 'url';

interface IResultsGraphPageProps {
  from?: Url;
}

const ResultsGraphPage: NextPage<IResultsGraphPageProps> = ({ from }) => {
  return (
    <div>
      <VizPageLayout from={from} vizPage="results_graph"></VizPageLayout>
    </div>
  );
};

export default ResultsGraphPage;
