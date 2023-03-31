import { Button, Text } from '@chakra-ui/react';
import { SettingsLayout } from '@components';
import { composeNextGSSP } from '@ssrUtils';
import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';

const DeleteAccountPage = ({}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return (
    <SettingsLayout title="Delete Account">
      <Text>This action cannot be reversed</Text>
      <Button variant="warning" size="md">
        Delete My Account
      </Button>
    </SettingsLayout>
  );
};

export default DeleteAccountPage;

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
});
