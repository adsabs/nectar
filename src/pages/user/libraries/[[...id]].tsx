import { Center, Text } from '@chakra-ui/react';
import { composeNextGSSP } from '@/ssr-utils';
import { QueryClient } from '@tanstack/react-query';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { logger } from '@/logger';
import { BRAND_NAME_FULL } from '@/config';
import { CustomInfoMessage, LoadingMessage } from '@/components/Feedbacks';
import { SimpleLink } from '@/components/SimpleLink';
import { LibrariesLandingPane, LibraryEntityPane, LibrarySettingsPane } from '@/components/Libraries';
import { unwrapStringValue } from '@/utils/common/formatters';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { fetchLibraries, fetchLibraryEntity, librariesKeys, useGetLibraryEntity } from '@/api/biblib/libraries';

interface ILibrariesHomeProps {
  id?: string;
  subpage?: string;
  from?: string;
}

const LibrariesHome: NextPage<ILibrariesHomeProps> = ({ id, subpage, from }) => {
  const {
    data: library,
    isLoading: isLoadingLib,
    error,
  } = useGetLibraryEntity(
    {
      id,
    },
    { enabled: !!id },
  );

  const title = !!id
    ? `${unwrapStringValue(library?.metadata?.name)} - ${BRAND_NAME_FULL} library`
    : `${BRAND_NAME_FULL} libraries`;

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      {!!id && isLoadingLib && (
        <Center>
          <LoadingMessage message="Loading library" />
        </Center>
      )}
      {!!id && error && (
        <CustomInfoMessage
          status={'error'}
          title={'Library not found'}
          description={
            <Text>
              Library does not exist.{' '}
              <SimpleLink href={'/user/libraries'} display="inline">
                View all libraries.
              </SimpleLink>
            </Text>
          }
        />
      )}

      {!!id && !!library ? (
        <>
          {subpage === 'settings' ? (
            <LibrarySettingsPane id={id} isFromLanding={from === 'landing'} />
          ) : (
            <LibraryEntityPane id={id} publicView={false} />
          )}
        </>
      ) : (
        <>{!id ? <LibrariesLandingPane /> : null}</>
      )}
    </>
  );
};

export default LibrariesHome;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx) => {
  const { id = null } = ctx.params;
  const { from = null } = ctx.query;

  const queryClient = new QueryClient();

  try {
    if (!id) {
      void (await queryClient.prefetchQuery({
        queryKey: librariesKeys.libraries({}),
        queryFn: fetchLibraries,
        meta: { params: {} },
      }));

      return Promise.resolve({
        props: {},
      });
    }

    const libraryId = id[0];
    const subpage = id[1] ?? null;

    void (await queryClient.prefetchQuery({
      queryKey: librariesKeys.library({ id: libraryId }),
      queryFn: fetchLibraryEntity,
      meta: { params: { id: libraryId } },
      staleTime: 0,
    }));

    return Promise.resolve({
      props: {
        id: libraryId,
        subpage: subpage,
        from,
      },
    });
  } catch (error) {
    logger.error({ msg: 'GSSP error on individual library page', error });
    return Promise.resolve({
      props: {
        pageError: parseAPIError(error),
      },
    });
  }
});
