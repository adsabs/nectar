import { fetchLibraries, fetchLibraryEntity, librariesKeys, useGetLibraryEntity } from '@api';
import { Center, Text } from '@chakra-ui/react';
import {
  CustomInfoMessage,
  LibrariesLandingPane,
  LibraryEntityPane,
  LibrarySettingsPane,
  LoadingMessage,
  SimpleLink,
} from '@components';
import { composeNextGSSP } from '@ssr-utils';
import { QueryClient } from '@tanstack/react-query';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';

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
    refetch,
  } = useGetLibraryEntity(
    {
      id,
    },
    { enabled: !!id },
  );

  return (
    <>
      <Head>
        <title>{`NASA Science Explorer - Libraries - ${!!id ? library?.metadata.name ?? '' : ''}`}</title>
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
            <LibrarySettingsPane library={library} onRefetch={refetch} isFromLanding={from === 'landing'} />
          ) : (
            <LibraryEntityPane library={library} publicView={false} onRefetch={refetch} />
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

  const lid = id[0];
  const subpage = id[1] ?? null;

  void (await queryClient.prefetchQuery({
    queryKey: librariesKeys.library({ id: lid }),
    queryFn: fetchLibraryEntity,
    meta: { params: { id: lid } },
  }));

  return Promise.resolve({
    props: {
      id: lid,
      subpage: subpage,
      from,
    },
  });
});
