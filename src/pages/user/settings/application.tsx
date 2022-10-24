import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';

const AppSettingsPage = ({}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return <h2>Settings</h2>;
};

export default AppSettingsPage;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
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
}
