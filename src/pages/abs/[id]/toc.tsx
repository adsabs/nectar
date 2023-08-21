import { getTocParams, IADSApiSearchResponse, searchKeys, useGetToc } from '@api';
import { Alert, AlertIcon } from '@chakra-ui/react';
import { AbstractRefList } from '@components/AbstractRefList';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { withDetailsPage } from '@hocs/withDetailsPage';
import { useGetAbstractDoc } from '@lib/useGetAbstractDoc';
import { useGetAbstractParams } from '@lib/useGetAbstractParams';
import { normalizeURLParams, unwrapStringValue } from '@utils';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { dehydrate, DehydratedState, hydrate, QueryClient } from '@tanstack/react-query';
import { composeNextGSSP } from '@ssr-utils';

interface IVolumePageProps {
  id: string;
  error?: {
    status?: string;
    message?: string;
  };
}

const VolumePage: NextPage<IVolumePageProps> = (props: IVolumePageProps) => {
  const { id, error } = props;
  const doc = useGetAbstractDoc(id);

  const { getParams, onPageChange } = useGetAbstractParams(doc.bibcode);

  const { data, isSuccess } = useGetToc(getParams(), { keepPreviousData: true });
  const tocParams = getTocParams(doc.bibcode, 0);
  const title = unwrapStringValue(doc?.title);

  return (
    <AbsLayout doc={doc} titleDescription="Papers in the same volume as">
      <Head>
        <title>NASA Science Explorer - Volume - {title}</title>
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
          searchLinkParams={tocParams}
        />
      )}
    </AbsLayout>
  );
};

export default VolumePage;

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

    const params = getTocParams(bibcode, 0);
    void (await queryClient.prefetchQuery({
      queryKey: searchKeys.toc({ bibcode, start: params.start }),
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
