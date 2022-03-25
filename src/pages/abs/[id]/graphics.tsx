import { IADSApiSearchResponse } from '@api';
import { Alert, AlertIcon } from '@chakra-ui/alert';
import { Box, Flex, Link } from '@chakra-ui/layout';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { withDetailsPage } from '@hocs/withDetailsPage';
import { useGetAbstractDoc } from '@hooks/useGetAbstractDoc';
import { composeNextGSSP, normalizeURLParams } from '@utils';
import { fetchGraphics, graphicsKeys, useGetGraphics } from '@_api/graphics';
import { searchKeys } from '@_api/search';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import NextImage from 'next/image';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { dehydrate, DehydratedState, hydrate, QueryClient } from 'react-query';
import { toast } from 'react-toastify';

interface IGraphicsPageProps {
  id: string;
  error?: {
    status?: string;
    message?: string;
  };
}

const GraphicsPage: NextPage<IGraphicsPageProps> = (props: IGraphicsPageProps) => {
  const { id } = props;
  const router = useRouter();

  const doc = useGetAbstractDoc(id);

  const {
    data: graphics,
    isError,
    isSuccess,
    error,
  } = useGetGraphics(doc.bibcode, { keepPreviousData: true, retry: false });

  useEffect(() => {
    if (isError) {
      void router.replace('/abs/[id]/abstract', `/abs/${id}/abstract`);
      toast(error, { type: 'error' });
    }
  }, [isError]);

  return (
    <AbsLayout doc={doc} titleDescription="Graphics from">
      <Head>
        <title>NASA Science Explorer - Graphics - {doc.title[0]}</title>
      </Head>
      {error && (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      )}
      {isSuccess && (
        <>
          <Box dangerouslySetInnerHTML={{ __html: graphics.header }}></Box>
          <Flex wrap="wrap">
            {graphics.figures.map((figure, index) => {
              return (
                <Flex
                  key={index}
                  direction="column"
                  alignItems="center"
                  borderWidth={1}
                  borderColor="gray.100"
                  borderRadius="md"
                  p={2}
                  m={2}
                >
                  <NextLink href={figure.images[0].highres} passHref>
                    <Link target="_blank" rel="noreferrer noopener">
                      <NextImage
                        src={figure.images[0].thumbnail}
                        width="150"
                        height="150"
                        className="p-5"
                        alt={figure.figure_label}
                      ></NextImage>
                    </Link>
                  </NextLink>
                  <Box aria-hidden="true">{figure.figure_label}</Box>
                </Flex>
              );
            })}
          </Flex>
        </>
      )}
    </AbsLayout>
  );
};

export default GraphicsPage;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(withDetailsPage, async (ctx, state) => {
  const api = (await import('@_api/api')).default;
  const axios = (await import('axios')).default;
  api.setToken(ctx.req.session.userData.access_token);
  const query = normalizeURLParams(ctx.query);

  try {
    const queryClient = new QueryClient();
    hydrate(queryClient, state.props?.dehydratedState as DehydratedState);
    const {
      response: {
        docs: [{ bibcode }],
      },
    } = queryClient.getQueryData<IADSApiSearchResponse>(searchKeys.abstract(query.id));

    void (await queryClient.prefetchQuery({
      queryKey: graphicsKeys.primary(bibcode),
      queryFn: fetchGraphics,
      meta: { params: { bibcode } },
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
