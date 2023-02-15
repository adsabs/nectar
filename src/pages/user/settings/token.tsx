import { Code, Input, InputGroup, InputRightAddon, Stack, Text } from '@chakra-ui/react';
import { SettingsLayout, SimpleLink } from '@components';
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
      <Stack direction="column" gap={2}>
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
        <Text>
          This API token allows you to access ADS data programmatically. For instance, to fetch the first few bibcodes
          for the query "star", make the following request: curl -H 'Authorization:{' '}
        </Text>
        <Code my={2}>
          Bearer:whGLDDEhKdUDiAOsPoTKkKSBrxWMeJeHvxMEqyvQ'
          'https://api.adsabs.harvard.edu/v1/search/query?q=star&fl=bibcode'
        </Code>
        <Text as="i">
          (If you've generated a token, you can copy-paste the preceding line directly into your terminal)
        </Text>
        <Text>
          Documentation on how to use the API is available on the{' '}
          <SimpleLink href="https://github.com/adsabs/adsabs-dev-api#access-settings" newTab display="inline">
            ADS API Github repo
          </SimpleLink>
        </Text>
        <Text>
          Make sure to keep your API key secret to protect it from abuse. If your key has been exposed publically (say,
          by accidentally being commited to a Github repo) you can generate a new one by clicking on the button above.
        </Text>
      </Stack>
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
