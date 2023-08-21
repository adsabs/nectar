import { getSimilarParams, IADSApiSearchResponse, searchKeys, useGetSimilar } from '@api';
import { Alert, AlertIcon } from '@chakra-ui/react';
import { AbstractRefList } from '@components';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { withDetailsPage } from '@hocs/withDetailsPage';
import { useGetAbstractDoc } from '@lib/useGetAbstractDoc';
import { useGetAbstractParams } from '@lib/useGetAbstractParams';
import { unwrapStringValue } from '@utils';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { dehydrate, DehydratedState, hydrate, QueryClient } from '@tanstack/react-query';
import { normalizeURLParams } from 'src/utils';
import { composeNextGSSP } from '@ssr-utils';

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
  const title = unwrapStringValue(doc?.title);

  return (
    <AbsLayout doc={doc} titleDescription="Papers similar to">
      <Head>
        <title>NASA Science Explorer - Similar - {title}</title>
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
          searchLinkParams={similarParams}
        />
      )}
    </AbsLayout>
  );
};

export default SimilarPage;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(withDetailsPage, async (ctx, state) => {
  const { fetchSearch } = await import('@api');
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
