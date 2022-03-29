import { VizPageLayout } from '@components';
import { NextPage } from 'next';

import { Url } from 'url';

interface IPaperMetworkPageProps {
  from?: Url;
}

const PaperMetworkPage: NextPage<IPaperMetworkPageProps> = ({ from }) => {
  return (
    <div>
      <VizPageLayout from={from} vizPage="paper_network"></VizPageLayout>
    </div>
  );
};

export default PaperMetworkPage;
