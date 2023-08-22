import { Button, Text } from '@chakra-ui/react';
import { SettingsLayout } from '@components';
import { useOrcid } from '@lib/orcid/useOrcid';
import { UserSettings } from '@components/Orcid';

const OrcidPage = () => {
  const { login, isAuthenticated } = useOrcid();

  if (!isAuthenticated) {
    return (
      <SettingsLayout title="ORCiD Settings">
        <Button mb={2} size="md" onClick={login}>
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
      <UserSettings />
    </SettingsLayout>
  );
};

export default OrcidPage;
export { injectSessionGSSP as getServerSideProps } from '@ssr-utils';
