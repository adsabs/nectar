import { SettingsLayout } from '@components';
import { composeNextGSSP, userGSSP } from '@utils';
import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';

const UpdateEmailPage = ({}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return <SettingsLayout title="Update Email"></SettingsLayout>;
};

export default UpdateEmailPage;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx: GetServerSidePropsContext) => {
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
}, userGSSP);
