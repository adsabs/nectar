import { VizPageLayout } from '@components';
import { NextPage } from 'next';

import { Url } from 'url';

interface IConceptCloudPageProps {
  from?: Url;
}

const ConceptCloudPage: NextPage<IConceptCloudPageProps> = ({ from }) => {
  return (
    <div>
      <VizPageLayout from={from} vizPage="concept_cloud"></VizPageLayout>
    </div>
  );
};

export default ConceptCloudPage;
