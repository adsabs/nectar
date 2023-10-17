import { useGetLibraryEntity } from '@api';
import { Center, Text } from '@chakra-ui/react';
import {
  CustomInfoMessage,
  LibrariesLandingPane,
  LibraryEntityPane,
  LibrarySettingsPane,
  LoadingMessage,
  SimpleLink,
} from '@components';
import { LibrariesLayout } from '@components/Layout/LibrariesLayout';
import { composeNextGSSP } from '@ssr-utils';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';

const LibrariesHome: NextPage = () => {
  const router = useRouter();

  const id = router.query.id?.[0] ?? null;
  const subpage = router.query.id?.[1] ?? null;

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

  return (
    <LibrariesLayout title="NASA Science Explorer - My Libraries">
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
      {!!id && !!library && !subpage && <LibraryEntityPane library={library} publicView={false} />}
      {!!id && !!library && subpage === 'settings' && <LibrarySettingsPane id={id} />}
      {!id && <LibrariesLandingPane />}
    </LibrariesLayout>
  );
};

export default LibrariesHome;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx) => {
  if (!ctx.req.session.isAuthenticated) {
    return Promise.resolve({
      redirect: {
        destination: `/user/account/login?redirectUri=${encodeURIComponent(ctx.req.url)}`,
        permanent: false,
      },
      props: {},
    });
  }

  return Promise.resolve({
    props: {},
  });
});
