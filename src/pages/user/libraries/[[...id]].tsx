import { LibrariesLandingPane } from '@components';
import { composeNextGSSP } from '@ssr-utils';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';

const LibrariesHome: NextPage = () => {
  const router = useRouter();

  if (router.query.id) {
    const id = router.query.id;
    return <>{id}</>;
  } else {
    return (
      <>
        <LibrariesLandingPane />
      </>
    );
  }
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
