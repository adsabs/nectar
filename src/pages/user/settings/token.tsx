import { Input, InputGroup, InputRightAddon } from '@chakra-ui/react';
import { SettingsLayout } from '@components';
import { composeNextGSSP, userGSSP } from '@utils';
import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';

const ApiTokenPage = ({}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  // TODO get token
  const token = 'xxxxxxx';

  const handleGenerateToken = () => {
    console.log('generate new token');
  };

  return (
    <SettingsLayout title="API Token">
      <InputGroup size="md">
        <Input type="text" name="token" id="token" value={token} autoFocus isReadOnly />
        <InputRightAddon
          children="Generate New Token"
          bgColor="blue.500"
          color="gray.50"
          borderColor="blue.500"
          borderRightRadius="sm"
          cursor="pointer"
          onClick={handleGenerateToken}
        />
      </InputGroup>
    </SettingsLayout>
  );
};

export default ApiTokenPage;

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
