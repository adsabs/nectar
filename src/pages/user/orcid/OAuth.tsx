import { NextPage } from 'next';
import { useRouter } from 'next/router';
import {
  Alert,
  Button,
  Card,
  CardBody,
  Container,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { isString } from '@utils';
import { useOrcidExchangeToken, useOrcidPreferences, useOrcidSetPreferences } from '@api/orcid/orcid';
import { isArray } from 'ramda-adjunct';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, useStore } from '@store';
import { isValidIOrcidUser } from '@api/orcid/models';
import { useRedirectWithNotification } from '@components/Notification';
import { SimpleLink } from '@components';

const setOrcidUserSelector = (state: AppState) => state.setOrcidUser;

const OrcidPage: NextPage = () => {
  const setOrcidUser = useStore(setOrcidUserSelector);
  const redirect = useRedirectWithNotification();
  const router = useRouter();
  const code = isArray(router.query.code) ? router.query.code[0] : router.query.code;
  const cancelRef = useRef<HTMLButtonElement>();

  // focus on cancel button when page loads
  useEffect(() => {
    if (cancelRef?.current) {
      cancelRef.current.focus();
    }
  }, [cancelRef?.current]);

  // exchange code for token, and get back user
  const {
    data: user,
    error: tokenError,
    isLoading,
  } = useOrcidExchangeToken(
    { code },
    {
      enabled: isString(code),
    },
  );

  // fetch preferences
  const { data: preferences, error: getPrefsError } = useOrcidPreferences(
    { user },
    {
      enabled: isValidIOrcidUser(user),
    },
  );

  const { mutate: setPreferences, error: setPrefsError } = useOrcidSetPreferences({ user });

  // on cancel, redirect back to home page
  const handleCancel = () => {
    setPreferences({ preferences: { authorizedUser: false } });
    void router.replace('/');
  };

  // on authorize, set preferences and redirect back to dashboard
  const handleAuthorize = useCallback(() => {
    if (isValidIOrcidUser(user)) {
      // set the user in the store (i.e. login to orcid)
      setOrcidUser(user);
    }
    setPreferences({ preferences: { authorizedUser: true } });
    void router.replace('/user/orcid');
  }, [user, setPreferences, router, setOrcidUser, isValidIOrcidUser]);

  // in the case we have an issue authenticating, redirect back to home page
  useEffect(() => {
    if (tokenError || getPrefsError || setPrefsError) {
      void redirect('orcid-auth-failed', { path: '/', replace: true });
    }
  }, [tokenError, getPrefsError, setPrefsError]);

  // if we have a user and preferences, then we can redirect to the dashboard
  useEffect(() => {
    if (isValidIOrcidUser(user) && preferences?.authorizedUser) {
      setOrcidUser(user);
      void router.replace('/user/orcid');
    }
  }, [user, preferences?.authorizedUser]);

  // if we're loading, or have an error, show a spinner
  if (isLoading || tokenError || getPrefsError) {
    return (
      <Container centerContent size="md" py="20">
        <Alert status="info" display="flex" justifyContent="center">
          <Spinner />
          <Text ml="2">Authenticating with ORCiD</Text>
        </Alert>
      </Container>
    );
  }

  if (preferences?.authorizedUser) {
    return (
      <Container centerContent size="md" py="20">
        <Card variant="elevated">
          <CardBody>
            <Heading as="h2" size="sm">
              Authenticated with ORCiD
            </Heading>
            <Text>
              You should be redirected, if not please click <SimpleLink href="/user/orcid">here</SimpleLink>
            </Text>
          </CardBody>
        </Card>
      </Container>
    );
  }

  return (
    <Container centerContent size="lg" py="20">
      <Card variant="elevated">
        <CardBody>
          <Stack>
            <FormControl>
              <FormLabel>Authorize SCiX to Record and Publish Claims</FormLabel>
              <Text>
                Allow SCiX to record my claims and to make them available publicly for auditing and indexing. This makes
                me an "ADS Verified User" and allows ADS to validate my name(s) against author lists in papers.
              </Text>
            </FormControl>

            <HStack>
              <Button flex="1" colorScheme="red" mr={3} ref={cancelRef} onClick={handleCancel}>
                Cancel
              </Button>
              <Button flex="1" onClick={handleAuthorize}>
                Authorize
              </Button>
            </HStack>
          </Stack>
        </CardBody>
      </Card>
    </Container>
  );
};

export default OrcidPage;

export { injectSessionGSSP as getServerSideProps } from '@ssr-utils';
