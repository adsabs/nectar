import { Button, Text } from '@chakra-ui/react';

import { useOrcid } from '@/lib/orcid/useOrcid';
import { UserSettings } from '@/components/Orcid';
import { SettingsLayout } from '@/components/Layout';

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
          Please sign in with your ORCID credentials and click on the &#34;authorize&#34; button.
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
export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
