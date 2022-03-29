import { VizPageLayout } from '@components';
import { NextPage } from 'next';

import { Url } from 'url';

interface IAuthorNetworkPageProps {
  from?: Url;
}

const AuthorNetworkPage: NextPage<IAuthorNetworkPageProps> = ({ from }) => {
  return (
    <div>
      <VizPageLayout from={from} vizPage="author_network"></VizPageLayout>
    </div>
  );
};

export default AuthorNetworkPage;
