import { BasicStatsKey, CitationsStatsKey, IDocsEntity, MetricsResponseKey, useGetAbstract, useGetMetrics } from '@api';
import { Box } from '@chakra-ui/react';
import { LoadingMessage, MetricsPane } from '@components';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { withDetailsPage } from '@hocs/withDetailsPage';
import { unwrapStringValue } from '@utils';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { composeNextGSSP } from '@ssr-utils';
import { path } from 'ramda';
import { useRouter } from 'next/router';
import { getDetailsPageTitle } from '@pages/abs/[id]/abstract';

const MetricsPage: NextPage = () => {
  const router = useRouter();
  const { data } = useGetAbstract({ id: router.query.id as string });
  const doc = path<IDocsEntity>(['docs', 0], data);

  const {
    data: metrics,
    isError,
    isLoading,
    isSuccess,
  } = useGetMetrics(doc?.bibcode, { enabled: !!doc?.bibcode, keepPreviousData: true });

  const hasCitations = isSuccess && metrics && metrics[MetricsResponseKey.CS][CitationsStatsKey.TNC] > 0;
  const hasReads = isSuccess && metrics && metrics[MetricsResponseKey.BS][BasicStatsKey.TNR] > 0;

  return (
    <AbsLayout doc={doc} titleDescription="Metrics for">
      <Head>
        <title>{getDetailsPageTitle(doc, 'Metrics')}</title>
      </Head>
      {isError && (
        <Box mt={5} fontSize="xl">
          Unable to fetch metrics
        </Box>
      )}
      {!isError && !isLoading && !hasCitations && !hasReads ? (
        <Box mt={5} fontSize="xl">
          No metrics data
        </Box>
      ) : (
        <>{isLoading ? <LoadingMessage message="Loading" /> : <MetricsPane metrics={metrics} isAbstract={true} />} </>
      )}
    </AbsLayout>
  );
};

export default MetricsPage;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(withDetailsPage);
