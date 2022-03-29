import { VizPageLayout } from '@components';
import { NextPage } from 'next';

import { Url } from 'url';

interface IOverviewPageProps {
  from?: Url;
}

const OverviewPage: NextPage<IOverviewPageProps> = ({ from }) => {
  return (
    <div>
      <VizPageLayout from={from} vizPage="overview"></VizPageLayout>
    </div>
  );
};

export default OverviewPage;
