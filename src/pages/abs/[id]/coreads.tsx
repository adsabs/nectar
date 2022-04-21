import { IADSApiSearchResponse } from '@api';
import { Alert, AlertIcon } from '@chakra-ui/alert';
import { AbstractRefList } from '@components';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { withDetailsPage } from '@hocs/withDetailsPage';
import { useGetAbstractParams } from '@hooks/useGetAbstractParams';
import { composeNextGSSP, setupApiSSR } from '@utils';
import { searchKeys, useGetAbstract, useGetCoreads } from '@_api/search';
import { getCoreadsParams } from '@_api/search/models';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { dehydrate, DehydratedState, hydrate, QueryClient } from 'react-query';
import { normalizeURLParams } from 'src/utils';

export interface ICoreadsPageProps {
  id: string;
  error?: {
    status?: string;
    message?: string;
  };
}

const CoreadsPage: NextPage<ICoreadsPageProps> = (props: ICoreadsPageProps) => {
  const { id, error } = props;
  const {
    data: {
      docs: [doc],
    },
  } = useGetAbstract({ id });

  const { getParams, onPageChange } = useGetAbstractParams(doc.bibcode);

  const { data, isSuccess } = useGetCoreads(getParams(), { keepPreviousData: true });
  const coreadsParams = getCoreadsParams(doc.bibcode, 0);

  return (
    <AbsLayout doc={doc} titleDescription="Papers also read by those who read">
      <Head>
        <title>NASA Science Explorer - Coreads - {doc.title[0]}</title>
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
              q: coreadsParams.q,
              sort: coreadsParams.sort,
            },
          }}
        />
      )}
    </AbsLayout>
  );
};

export default CoreadsPage;

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

    const params = getCoreadsParams(bibcode, 0);
    void (await queryClient.prefetchQuery({
      queryKey: searchKeys.coreads({ bibcode, start: params.start }),
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
