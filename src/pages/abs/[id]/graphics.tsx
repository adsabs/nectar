import AdsApi, { IADSApiGraphicsParams, IADSApiGraphicsResponse, IDocsEntity, IUserData } from '@api';
import { metatagsQueryFields } from '@components';
import { abstractPageNavDefaultQueryFields } from '@components/AbstractSideNav/model';
import { fetchHasGraphics, fetchHasMetrics } from '@components/AbstractSideNav/queries';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { normalizeURLParams } from '@utils';
import { GetServerSideProps, NextPage } from 'next';
import NextImage from 'next/image';
import NextLink from 'next/link';
import { dehydrate, QueryClient } from 'react-query';
import { Alert, AlertIcon } from '@chakra-ui/alert';
import { Box, Flex, Link } from '@chakra-ui/layout';
import Head from 'next/head';

interface IGraphicsPageProps {
  graphics?: IADSApiGraphicsResponse;
  originalDoc: IDocsEntity;
  error?: string;
}

const GraphicsPage: NextPage<IGraphicsPageProps> = (props: IGraphicsPageProps) => {
  const { originalDoc, graphics, error } = props;
  return (
    <AbsLayout doc={originalDoc} titleDescription="Graphics from">
      <Head>
        <title>NASA Science Explorer - Graphics - {originalDoc.title[0]}</title>
      </Head>
      {error ? (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      ) : (
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

export const getServerSideProps: GetServerSideProps<IGraphicsPageProps> = async (ctx) => {
  const query = normalizeURLParams(ctx.query);
  const request = ctx.req as typeof ctx.req & {
    session: { userData: IUserData };
  };
  const userData = request.session.userData;
  const params: IADSApiGraphicsParams = {
    bibcode: query.id,
  };
  const adsapi = new AdsApi({ token: userData.access_token });
  const result = await adsapi.graphics.query(params);
  const originalDoc = await adsapi.search.getDocument(query.id, [
    ...abstractPageNavDefaultQueryFields,
    ...metatagsQueryFields,
  ]);

  const queryClient = new QueryClient();
  if (!originalDoc.notFound && !originalDoc.error) {
    const { bibcode } = originalDoc.doc;
    void (await queryClient.prefetchQuery(['hasGraphics', bibcode], () => fetchHasGraphics(adsapi, bibcode)));
    void (await queryClient.prefetchQuery(['hasMetrics', bibcode], () => fetchHasMetrics(adsapi, bibcode)));
  }

  return originalDoc.notFound || originalDoc.error
    ? { notFound: true }
    : result.isErr()
    ? {
        props: {
          graphics: null,
          originalDoc: originalDoc.doc,
          dehydratedState: dehydrate(queryClient),
          error: 'Unable to get results',
        },
      }
    : {
        props: {
          graphics: result.value,
          originalDoc: originalDoc.doc,
          dehydratedState: dehydrate(queryClient),
        },
      };
};
