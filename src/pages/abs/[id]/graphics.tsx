import { useRouter } from 'next/router';
import { NextPage } from 'next';
import NextImage from 'next/image';

import { path } from 'ramda';
import { AbsLayout } from '@/components/Layout';
import { Box, Flex } from '@chakra-ui/react';
import { LoadingMessage } from '@/components/Feedbacks';
import { SimpleLink } from '@/components/SimpleLink';
import { useGetAbstract } from '@/api/search/search';
import { IDocsEntity } from '@/api/search/types';
import { useGetGraphics } from '@/api/graphics/graphics';

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
        <Box mt={5} fontSize="xl">
          No graphics
        </Box>
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
                  isExternal
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
