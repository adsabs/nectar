import { getReferencesParams, IADSApiSearchResponse, searchKeys, useGetReferences } from '@api';
import { Alert, AlertIcon } from '@chakra-ui/alert';
import { AbstractRefList } from '@components/AbstractRefList';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { withDetailsPage } from '@hocs/withDetailsPage';
import { useGetAbstractDoc } from '@hooks/useGetAbstractDoc';
import { useGetAbstractParams } from '@hooks/useGetAbstractParams';
import { unwrapStringValue } from '@utils';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { dehydrate, DehydratedState, hydrate, QueryClient } from 'react-query';
import { normalizeURLParams } from 'src/utils';
import { composeNextGSSP } from '@ssrUtils';

export interface IReferencesPageProps {
  id: string;
  error?: {
    status?: string;
    message?: string;
  };
}

const ReferencesPage: NextPage<IReferencesPageProps> = (props: IReferencesPageProps) => {
  const { id, error } = props;
  const doc = useGetAbstractDoc(id);

  const { getParams, onPageChange } = useGetAbstractParams(doc.bibcode);
  const { data, isSuccess } = useGetReferences(getParams(), { keepPreviousData: true });
  const referencesParams = getReferencesParams(doc.bibcode, 0);
  const title = unwrapStringValue(doc?.title);

  return (
    <AbsLayout doc={doc} titleDescription="Paper referenced by">
      <Head>
        <title>NASA Science Explorer - References - {title}</title>
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
          searchLinkParams={referencesParams}
        />
      )}
    </AbsLayout>
  );
};

export default ReferencesPage;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(
  withDetailsPage,
  async (ctx, state) => {
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

      const params = getReferencesParams(bibcode, 0);
      void (await queryClient.prefetchQuery({
        queryKey: searchKeys.references({ bibcode, start: params.start }),
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
  },
);
