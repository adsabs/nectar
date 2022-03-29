import { VizPageLayout } from '@components';
import { NextPage } from 'next';

import { Url } from 'url';

interface IMetricsPageProps {
  from?: Url;
}

const MetricsPage: NextPage<IMetricsPageProps> = ({ from }) => {
  return (
    <div>
      <VizPageLayout from={from} vizPage="metrics"></VizPageLayout>
    </div>
  );
};

export default MetricsPage;
