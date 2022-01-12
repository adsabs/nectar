import AdsApi, { IADSApiMetricsParams, IDocsEntity, IUserData } from '@api';
import { BasicStatsKey, CitationsStatsKey, IADSApiMetricsResponse, MetricsResponseKey } from '@api/lib/metrics/types';
import { metatagsQueryFields } from '@components';
import { abstractPageNavDefaultQueryFields } from '@components/AbstractSideNav/model';
import { fetchHasGraphics, fetchHasMetrics } from '@components/AbstractSideNav/queries';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { Metrics } from '@components/Metrics';
import { normalizeURLParams } from '@utils';
import { GetServerSideProps, NextPage } from 'next';
import { dehydrate, QueryClient } from 'react-query';
import { Alert, AlertIcon } from '@chakra-ui/alert';
import Head from 'next/head';

interface IMetricsPageProps {
  originalDoc: IDocsEntity;
  error?: string;
  metrics: IADSApiMetricsResponse;
}

const MetricsPage: NextPage<IMetricsPageProps> = (props: IMetricsPageProps) => {
  const { originalDoc, error, metrics } = props;

  const hasCitations =
    metrics && metrics[MetricsResponseKey.CITATION_STATS][CitationsStatsKey.TOTAL_NUMBER_OF_CITATIONS] > 0;

  const hasReads = metrics && metrics[MetricsResponseKey.BASIC_STATS][BasicStatsKey.TOTAL_NUMBER_OF_READS] > 0;

  return (
    <AbsLayout doc={originalDoc} titleDescription="Metrics for">
      <Head>
        <title>NASA Science Explorer - Metrics - {originalDoc.title[0]}</title>
      </Head>
      {error ? (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      ) : hasCitations || hasReads ? (
        <Metrics metrics={metrics} isAbstract={true} />
      ) : (
        <Alert status="error">
          <AlertIcon />
          No metrics data
        </Alert>
      )}
    </AbsLayout>
  );
};

export default MetricsPage;

export const getServerSideProps: GetServerSideProps<IMetricsPageProps> = async (ctx) => {
  const query = normalizeURLParams(ctx.query);
  const request = ctx.req as typeof ctx.req & {
    session: { userData: IUserData };
  };
  const userData = request.session.userData;
  const params: IADSApiMetricsParams = {
    bibcode: query.id,
  };
  const adsapi = new AdsApi({ token: userData.access_token });

  const result = await adsapi.metrics.query(params);
  const originalDoc = await adsapi.search.getDocument(query.id, [
    ...abstractPageNavDefaultQueryFields,
    ...metatagsQueryFields,
  ]);

  const queryClient = new QueryClient();
  if (!originalDoc.notFound && !originalDoc.error) {
    const { bibcode } = originalDoc.doc;
    void (await queryClient.prefetchQuery(['hasGraphics', bibcode], () => fetchHasGraphics(adsapi, bibcode)));
    void (await queryClient.prefetchQuery(['hasMetrics', bibcode], () => fetchHasMetrics(adsapi, bibcode)));
  }

  return originalDoc.notFound || originalDoc.error
    ? { notFound: true }
    : result.isErr()
    ? {
        props: {
          originalDoc: originalDoc.doc,
          dehydratedState: dehydrate(queryClient),
          error: 'Unable to get results',
          metrics: null,
        },
      }
    : {
        props: {
          originalDoc: originalDoc.doc,
          dehydratedState: dehydrate(queryClient),
          metrics: result.value,
        },
      };
};
