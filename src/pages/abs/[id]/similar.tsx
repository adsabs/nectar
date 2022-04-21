import { IADSApiSearchResponse } from '@api';
import { Alert, AlertIcon } from '@chakra-ui/react';
import { AbstractRefList } from '@components';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { withDetailsPage } from '@hocs/withDetailsPage';
import { useGetAbstractDoc } from '@hooks/useGetAbstractDoc';
import { useGetAbstractParams } from '@hooks/useGetAbstractParams';
import { composeNextGSSP, setupApiSSR } from '@utils';
import { searchKeys, useGetSimilar } from '@_api/search';
import { getSimilarParams } from '@_api/search/models';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { dehydrate, DehydratedState, hydrate, QueryClient } from 'react-query';
import { normalizeURLParams } from 'src/utils';

export interface ISimilarPageProps {
  id: string;
  error?: {
    status?: string;
    message?: string;
  };
}

const SimilarPage: NextPage<ISimilarPageProps> = (props: ISimilarPageProps) => {
  const { id, error } = props;
  const doc = useGetAbstractDoc(id);

  const { getParams, onPageChange } = useGetAbstractParams(doc.bibcode);

  const { data, isSuccess } = useGetSimilar(getParams(), { keepPreviousData: true });
  const similarParams = getSimilarParams(doc.bibcode, 0);

  return (
    <AbsLayout doc={doc} titleDescription="Papers similar to">
      <Head>
        <title>NASA Science Explorer - Similar - {doc.title[0]}</title>
      </Head>
      {error && (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      )}
      {isSuccess && (
        <AbstractRefList
          doc={doc}
          docs={data.docs}
          totalResults={data.numFound}
          onPageChange={onPageChange}
          href={{
            pathname: '/search',
            query: {
              q: similarParams.q,
              sort: similarParams.sort,
            },
          }}
        />
      )}
    </AbsLayout>
  );
};

export default SimilarPage;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(withDetailsPage, async (ctx, state) => {
  setupApiSSR(ctx);
  const { fetchSearch } = await import('@_api/search');
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

    const params = getSimilarParams(bibcode, 0);
    void (await queryClient.prefetchQuery({
      queryKey: searchKeys.similar({ bibcode, start: params.start }),
      queryFn: fetchSearch,
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
