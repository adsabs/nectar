import { IADSApiSearchResponse } from '@api';
import { IADSApiMetricsResponse } from '@api/lib/metrics/types';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { Metrics } from '@components/Metrics';
import { withDetailsPage } from '@hocs/withDetailsPage';
import { composeNextGSSP, normalizeURLParams } from '@utils';
import { fetchMetrics, metricsKeys, useGetMetrics } from '@_api/metrics';
import { searchKeys, useGetAbstract } from '@_api/search';
import { GetServerSideProps, NextPage } from 'next';
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

  const {
    data: {
      docs: [doc],
    },
  } = useGetAbstract({ id });

  const { data: metrics, isError, isSuccess, error } = useGetMetrics(doc.bibcode, { keepPreviousData: true });

  useEffect(() => {
    if (isError) {
      void router.replace('/abs/[id]/abstract', `/abs/${id}/abstract`);
      toast(error, { type: 'error' });
    }
  }, [isError]);

  console.log('metrics error!', { isError, isSuccess, error, metrics });

  return (
    <AbsLayout doc={doc}>
      <article aria-labelledby="title" className="mx-0 my-10 px-4 w-full bg-white md:mx-2">
        <div className="pb-1">
          <h2 className="prose-xl text-gray-900 font-medium leading-8" id="title">
            <span>Metrics for </span> <div className="text-2xl">{doc.title}</div>
          </h2>
        </div>
        {isError && <div className="flex items-center justify-center w-full h-full text-xl">{error}</div>}
        {isSuccess && <Metrics metrics={metrics as IADSApiMetricsResponse} isAbstract={true} />}
      </article>
    </AbsLayout>
  );
};

export default MetricsPage;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(withDetailsPage, async (ctx, state) => {
  const api = (await import('@_api/api')).default;
  const axios = (await import('axios')).default;
  api.setToken(ctx.req.session.userData.access_token);
  const query = normalizeURLParams(ctx.query);

  try {
    const queryClient = new QueryClient();
    hydrate(queryClient, state.props?.dehydratedState as DehydratedState);
    const {
      docs: [{ bibcode }],
    } = queryClient.getQueryData<IADSApiSearchResponse['response']>(searchKeys.abstract(query.id));

    void (await queryClient.prefetchQuery({
      queryKey: metricsKeys.primary(bibcode),
      queryFn: fetchMetrics,
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
