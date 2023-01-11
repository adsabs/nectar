import { Button, Text } from '@chakra-ui/react';
import { SettingsLayout } from '@components';
import { composeNextGSSP, userGSSP } from '@utils';
import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';

const OrcidPage = ({}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return (
    <SettingsLayout title="ORCiD Settings">
      <Button mb={2} size="md">
        Authenticate ORCiD
      </Button>
      <Text fontSize="sm">
        You will be redirected to ORCID. <br />
        Please sign in with your ORCID credentials and click on the "authorize" button.
      </Text>
    </SettingsLayout>
  );
};

export default OrcidPage;

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
