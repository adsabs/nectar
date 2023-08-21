import { fetchGraphics, graphicsKeys, IADSApiSearchResponse, searchKeys, useGetGraphics } from '@api';
import { Box, Flex, Link } from '@chakra-ui/react';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { withDetailsPage } from '@hocs/withDetailsPage';
import { useGetAbstractDoc } from '@lib/useGetAbstractDoc';
import { composeNextGSSP } from '@ssr-utils';
import { normalizeURLParams, unwrapStringValue } from '@utils';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import NextImage from 'next/legacy/image';
import NextLink from 'next/link';
import { dehydrate, DehydratedState, hydrate, QueryClient } from '@tanstack/react-query';

interface IGraphicsPageProps {
  id: string;
  error?: {
    status?: string;
    message?: string;
  };
}

const GraphicsPage: NextPage<IGraphicsPageProps> = (props: IGraphicsPageProps) => {
  const { id } = props;

  const doc = useGetAbstractDoc(id);
  const title = unwrapStringValue(doc?.title);

  const { data: graphics, isError, isSuccess } = useGetGraphics(doc.bibcode, { keepPreviousData: true, retry: false });
  return (
    <AbsLayout doc={doc} titleDescription="Graphics from">
      <Head>
        <title>NASA Science Explorer - Graphics - {title}</title>
      </Head>
      {isError && (
        <Box mt={5} fontSize="xl">
          Unable to fetch graphics
        </Box>
      )}
      {!isError && !graphics && (
        <Box mt={5} fontSize="xl">
          No graphics
        </Box>
      )}
      {isSuccess && graphics && (
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
                  <NextLink href={figure.images[0].highres} passHref legacyBehavior>
                    <Link target="_blank" rel="noreferrer noopener">
                      <NextImage
                        src={figure.images[0].thumbnail}
                        width="150"
                        height="150"
                        className="p-5"
                        alt={figure.figure_label}
                      />
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
