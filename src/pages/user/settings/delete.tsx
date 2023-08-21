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

export { injectSessionGSSP as getServerSideProps } from '@ssr-utils';
