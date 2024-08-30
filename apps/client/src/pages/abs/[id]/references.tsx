import { Skeleton } from '@chakra-ui/react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { InferGetServerSidePropsType, NextPage } from 'next';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { AbstractRefList } from '@/components/AbstractRefList';
import { getFallBackAlert } from '@/components/Feedbacks/SuspendedAlert';
import { AbsLayout } from '@/components/Layout/AbsLayout';
import { withDetailsPage } from '@/hocs/withDetailsPage';

const ReferencesPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = (props) => {
  const { doc, params, page, error } = props;

  return (
    <AbsLayout doc={doc} error={error} params={params} titleDescription="Paper referenced by" label="References">
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            fallbackRender={getFallBackAlert({
              label: 'There was an issue displaying the references',
            })}
            onReset={reset}
          >
            <Suspense fallback={<Skeleton />}>
              <AbstractRefList id={doc.bibcode} params={params} page={page} />
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </AbsLayout>
  );
};

export default ReferencesPage;

export const getServerSideProps = withDetailsPage;
