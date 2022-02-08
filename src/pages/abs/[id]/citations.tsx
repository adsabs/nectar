import { IADSApiSearchParams, IADSApiSearchResponse } from '@api';
import { Alert, AlertIcon } from '@chakra-ui/alert';
import { AbstractRefList } from '@components/AbstractRefList';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { APP_DEFAULTS } from '@config';
import { withDetailsPage } from '@hocs/withDetailsPage';
import { useGetAbstractDoc } from '@hooks/useGetAbstractDoc';
import { composeNextGSSP } from '@utils';
import { searchKeys, useGetCitations } from '@_api/search';
import { getCitationsParams } from '@_api/search/models';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { dehydrate, DehydratedState, hydrate, QueryClient } from 'react-query';
import { normalizeURLParams } from 'src/utils';

export interface ICitationsPageProps {
  id: string;
  defaultParams: {
    start: IADSApiSearchParams['start'];
  };
  error?: {
    status?: string;
    message?: string;
  };
}

const CitationsPage: NextPage<ICitationsPageProps> = (props: ICitationsPageProps) => {
  const { id, error, defaultParams } = props;

  const doc = useGetAbstractDoc(id);
  const [start, setStart] = useState(defaultParams?.start ?? 0);
  const params = useMemo(() => ({ bibcode: doc.bibcode, start }), [doc, start]);
  const router = useRouter();

  const handlePageChange = (page: number, start: number) => {
    void router.push(
      { pathname: '/abs/[id]/citations', query: { p: page } },
      { pathname: `/abs/${doc.bibcode}/citations`, query: { p: page } },
      {
        shallow: true,
      },
    );
    setStart(start);
  };

  const { data, isSuccess } = useGetCitations(params, { keepPreviousData: true });
  const citationsParams = getCitationsParams(doc.bibcode, 0);

  return (
    <AbsLayout doc={doc} titleDescription="Papers that cite">
      <Head>
        <title>NASA Science Explorer - Citations - {doc.title[0]}</title>
      </Head>
      {error && (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      )}
      {isSuccess && (
        <AbstractRefList
          docs={data.docs}
          totalResults={data.numFound}
          onPageChange={handlePageChange}
          indexStart={params.start}
          resultsLinkHref={{
            pathname: '/search',
            query: {
              q: citationsParams.q,
              sort: citationsParams.sort,
            },
          }}
        />
      )}
    </AbsLayout>
  );
};

export default CitationsPage;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(withDetailsPage, async (ctx, state) => {
  const api = (await import('@_api/api')).default;
  const { fetchSearch } = await import('@_api/search');
  const axios = (await import('axios')).default;
  api.setToken(ctx.req.session.userData.access_token);
  const query = normalizeURLParams(ctx.query);
  const parsedPage = parseInt(query.p, 10);
  const page = isNaN(parsedPage) || Math.abs(parsedPage) >= 100 ? 1 : Math.abs(parsedPage);

  try {
    const queryClient = new QueryClient();
    hydrate(queryClient, state.props?.dehydratedState as DehydratedState);
    const {
      response: {
        docs: [{ bibcode }],
      },
    } = queryClient.getQueryData<IADSApiSearchResponse>(searchKeys.abstract(query.id));

    const params = getCitationsParams(bibcode, (page - 1) * APP_DEFAULTS.RESULT_PER_PAGE);
    void (await queryClient.prefetchQuery({
      queryKey: searchKeys.citations({ bibcode, start: params.start }),
      queryFn: fetchSearch,
      meta: { params },
    }));

    return {
      props: {
        dehydratedState: dehydrate(queryClient),
        defaultParams: {
          start: params.start,
        },
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
