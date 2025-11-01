import { useRouter } from 'next/router';
import { NextPage } from 'next';
import NextImage from 'next/image';

import { path } from 'ramda';
import { AbsLayout } from '@/components/Layout';
import { Box, Center, Flex, Text } from '@chakra-ui/react';
import { LoadingMessage } from '@/components/Feedbacks';
import { SimpleLink } from '@/components/SimpleLink';
import { useGetAbstract } from '@/api/search/search';
import { IDocsEntity } from '@/api/search/types';
import { useGetGraphics } from '@/api/graphics/graphics';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage } from '@fortawesome/free-solid-svg-icons';

const GraphicsPage: NextPage = () => {
  const router = useRouter();
  const { data } = useGetAbstract({ id: router.query.id as string });
  const doc = path<IDocsEntity>(['docs', 0], data);

  const {
    data: graphics,
    isLoading,
    isError,
    isSuccess,
  } = useGetGraphics(doc?.bibcode, { enabled: !!doc?.bibcode, keepPreviousData: true, retry: false });
  return (
    <AbsLayout doc={doc} titleDescription="Graphics from" label="Graphics">
      {isError && (
        <Box mt={5} fontSize="xl">
          Unable to fetch graphics
        </Box>
      )}
      {!isError && !isLoading && !graphics && (
        <Center mt={10}>
          <Flex direction="column" align="center" gap={4}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              w={{ base: 24, md: 28 }}
              h={{ base: 24, md: 28 }}
              borderRadius="full"
              bg="gray.100"
              color="gray.400"
              boxShadow="inner"
              role="img"
              aria-label="No graphics available"
            >
              <FontAwesomeIcon icon={faImage} size="2x" aria-hidden="true" />
            </Box>
            <Text fontSize="lg" color="gray.500">
              No graphics available
            </Text>
          </Flex>
        </Center>
      )}
      {isLoading && <LoadingMessage message="Loading" />}
      {isSuccess && graphics && (
        <>
          <Box dangerouslySetInnerHTML={{ __html: graphics.header }}></Box>
          <Flex wrap="wrap">
            {graphics.figures.map((figure) => {
              return (
                <Flex
                  key={figure.figure_label}
                  direction="column"
                  alignItems="center"
                  borderWidth={1}
                  borderColor="gray.100"
                  borderRadius="md"
                  p={2}
                  m={2}
                  as={SimpleLink}
                  href={figure.images[0].highres}
                >
                  <NextImage src={figure.images[0].thumbnail} width="150" height="150" alt={figure.figure_label} />
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

export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
// export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx) => {
//   try {
//     const { id } = ctx.params as { id: string };
//     const queryClient = new QueryClient();
//     await queryClient.prefetchQuery({
//       queryKey: graphicsKeys.primary(id),
//       queryFn: fetchGraphics,
//       meta: { params: { bibcode: id } },
//     });
//     return {
//       props: {
//         dehydratedState: dehydrate(queryClient),
//       },
//     };
//   } catch (err) {
//     logger.error({ err, url: ctx.resolvedUrl }, 'Error fetching details');
//     return {
//       props: {
//         pageError: parseAPIError(err),
//       },
//     };
//   }
// });
