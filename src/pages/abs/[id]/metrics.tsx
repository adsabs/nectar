import { IADSApiSearchResponse } from '@api';
import { Alert, AlertIcon } from '@chakra-ui/alert';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { Metrics } from '@components/Metrics';
import { withDetailsPage } from '@hocs/withDetailsPage';
import { useGetAbstractDoc } from '@hooks/useGetAbstractDoc';
import { composeNextGSSP, normalizeURLParams, setupApiSSR } from '@utils';
import { fetchMetrics, metricsKeys, useGetMetrics } from '@_api/metrics';
import { getMetricsParams } from '@_api/metrics/model';
import { searchKeys } from '@_api/search';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { dehydrate, DehydratedState, hydrate, QueryClient } from 'react-query';
import { toast } from 'react-toastify';

interface IMetricsPageProps {
  id: string;
  error?: {
    status?: string;
    message?: string;
  };
}

const MetricsPage: NextPage<IMetricsPageProps> = (props: IMetricsPageProps) => {
  const { id } = props;
  const router = useRouter();

  const doc = useGetAbstractDoc(id);

  const { data: metrics, isError, isSuccess, error } = useGetMetrics(doc.bibcode, { keepPreviousData: true });

  useEffect(() => {
    if (isError) {
      void router.replace('/abs/[id]/abstract', `/abs/${id}/abstract`);
      toast(error, { type: 'error' });
    }
  }, [isError]);

  return (
    <AbsLayout doc={doc} titleDescription="Metrics for">
      <Head>
        <title>NASA Science Explorer - Metrics - {doc.title[0]}</title>
      </Head>
      {error && (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      )}
      {isSuccess && <Metrics metrics={metrics} isAbstract={true} />}
    </AbsLayout>
  );
};

export default MetricsPage;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(withDetailsPage, async (ctx, state) => {
  setupApiSSR(ctx);
  const axios = (await import('axios')).default;
  const query = normalizeURLParams(ctx.query);

  try {
    const queryClient = new QueryClient();
    hydrate(queryClient, state.props?.dehydratedState as DehydratedState);
    const {
      response: {
        docs: [{ bibcode }],
      },
    } = queryClient.getQueryData<IADSApiSearchResponse>(searchKeys.abstract(query.id));

    const params = getMetricsParams([bibcode]);

    void (await queryClient.prefetchQuery({
      queryKey: metricsKeys.primary([bibcode]),
      queryFn: fetchMetrics,
      meta: { params },
    }));

    return {
      props: {
        dehydratedState: dehydrate(queryClient),
      },
    };
  } catch (e) {
    if (axios.isAxiosError(e) && e.response) {
      return {
        props: {
          error: {
            status: e.response.status,
            message: e.message,
          },
        },
      };
    }
    return {
      props: {
        error: {
          status: 500,
          message: 'Unknown server error',
        },
      },
    };
  }
});
