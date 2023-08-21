import { AddIcon } from '@chakra-ui/icons';
import { Button, Checkbox, FormControl, FormLabel, Input, Stack, Text } from '@chakra-ui/react';
import { SettingsLayout } from '@components';
import { composeNextGSSP } from '@ssrUtils';
import { noop } from '@utils';
import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { useState } from 'react';

const OrcidPage = ({}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const [isLoggedIn] = useState(false);

  const handleSubmit = noop;
  if (!isLoggedIn) {
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
  }

  // If logged into ORCiD
  return (
    <SettingsLayout title="ORCiD Settings">
      <form onSubmit={handleSubmit}>
        <Stack direction="column" spacing="5">
          <Text>
            You are signed into ORCiD as
            <br /> Not you?{' '}
            <Button mb={2} size="md" variant="link">
              Sign into ORCiD as a different user
            </Button>
          </Text>
          <FormControl>
            <FormLabel>Your Current Academy Affliation</FormLabel>
            <Input type="text" size="md" />
          </FormControl>
          <FormControl>
            <FormLabel>Names Under Which You Have Published</FormLabel>
            <Text>
              If you have published under a different surname, for example, or using a middle name, please add those
              name variations here.
            </Text>
            <Button my={2} leftIcon={<AddIcon />}>
              Add a name
            </Button>
          </FormControl>
          <FormControl>
            <FormLabel>Permission for ADS to Record and Publish Claims</FormLabel>
            <Checkbox alignItems="start">
              {' '}
              I allow the ADS to record my claims and to make them available publically for auditing and indexing. This
              makes me an "ADS Verified User" and allows ADS to validate my name(s) against author lists in papers.
            </Checkbox>
          </FormControl>
          <Button type="submit" size="md" w={20}>
            Submit
          </Button>
        </Stack>
      </form>
    </SettingsLayout>
  );
};

export default OrcidPage;
export { injectSessionGSSP as getServerSideProps } from '@ssr-utils';
