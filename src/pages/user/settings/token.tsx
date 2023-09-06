import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Code,
  Heading,
  HStack,
  InputGroup,
  InputLeftAddon,
  InputRightAddon,
  Spinner,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { PasswordTextInput, SettingsLayout, SimpleCopyButton, SimpleLink, StandardAlertMessage } from '@components';
import { Suspense, useRef } from 'react';
import { dehydrate, QueryClient, QueryErrorResetBoundary, useQueryClient } from '@tanstack/react-query';
import { fetchUserApiToken, useGenerateNewApiToken, useGetUserApiToken, userKeys } from '@api';
import { ErrorBoundary } from 'react-error-boundary';
import { getFallBackAlert } from '@components/Feedbacks/SuspendedAlert';
import { composeNextGSSP } from '@ssr-utils';

const ApiTokenPage = () => {
  const qc = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();
  const toast = useToast();

  const {
    mutate: generateToken,
    isError,
    isLoading,
  } = useGenerateNewApiToken({
    onSuccess: (data) => {
      // update the query cache
      qc.setQueryData(userKeys.userApiToken(), () => data);
    },
    onError: () => {
      toast({
        title: 'Unable to generate a new token',
        description: 'Please try again',
        status: 'error',
      });
    },
  });

  const handleGenerateToken = () => {
    onClose();
    generateToken();
  };

  return (
    <SettingsLayout title="API Token">
      <AlertDialog isOpen={isOpen} onClose={onClose} leastDestructiveRef={cancelRef}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Generate New Token</AlertDialogHeader>
            <AlertDialogCloseButton />
            <AlertDialogBody>
              Generating a new token will invalidate the existing token. This action cannot be undone. Continue?
            </AlertDialogBody>
            <AlertDialogFooter backgroundColor="transparent">
              <Button ref={cancelRef} onClick={onClose} colorScheme="gray" mx={2} color="gray.700">
                Cancel
              </Button>
              <Button onClick={handleGenerateToken} my={2}>
                Confirm
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      {isError && (
        <StandardAlertMessage status="error" title="Unable to generate a token" description="Please try again" />
      )}
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            onReset={reset}
            fallbackRender={getFallBackAlert({
              status: 'error',
              label: 'Unable to fetch personal API token',
              mapErrorMessages: {
                'invalid-token': 'There was a problem fetching your personal API token.  Please try again later.',
              },
            })}
          >
            <Suspense fallback={<Spinner />}>
              <TokenArea onGenerate={onOpen} isLoading={isLoading} />
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </SettingsLayout>
  );
};

const TokenArea = (props: { onGenerate: () => void; isLoading: boolean }) => {
  const { isLoading, onGenerate } = props;
  const { data } = useGetUserApiToken({ suspense: true, retry: false });

  if (data && data?.message === 'no ADS API client found') {
    return (
      <Stack direction="column" gap={2}>
        <Text>You do not have an API token yet. Please click on the button below to generate a new token.</Text>
        <Button onClick={onGenerate}>Generate New Token</Button>
      </Stack>
    );
  }

  return (
    <Stack direction="column" gap={2}>
      <InputGroup size="md">
        <InputLeftAddon children={<SimpleCopyButton text={data?.access_token} />} />
        <PasswordTextInput name="token" id="token" value={data?.access_token} autoFocus isReadOnly />
        <InputRightAddon
          bgColor="blue.500"
          color="gray.50"
          borderColor="blue.500"
          borderRightRadius="sm"
          cursor="pointer"
          onClick={onGenerate}
        >
          {isLoading ? <Spinner size="sm" /> : 'Generate New Token'}
        </InputRightAddon>
      </InputGroup>
      {!!data?.access_token && (
        <>
          <Text>
            This API token allows you to access ADS data programmatically. For instance, to fetch the first few bibcodes
            for the query "star", make the following request:
          </Text>
          <Heading size="sm" as="h2">
            API Usage
          </Heading>
          <HStack>
            <Code>
              {
                "curl -H 'Authorization: Bearer:*************************' https://api.adsabs.harvard.edu/v1/search/query?q=star&fl=bibcode"
              }
            </Code>
            <SimpleCopyButton
              variant="solid"
              text={`curl -H 'Authorization: Bearer:${
                data?.access_token ?? ''
              }' https://api.adsabs.harvard.edu/v1/search/query?q=star&fl=bibcode`}
            />
          </HStack>
          <Text fontStyle="italic" color="gray700">
            (copy/paste directly into your terminal)
          </Text>
        </>
      )}

      <Text>
        Documentation on how to use the API is available on the{' '}
        <SimpleLink href="https://github.com/adsabs/adsabs-dev-api#access-settings" newTab display="inline">
          ADS API Github repo
        </SimpleLink>
      </Text>
      <Text>
        Make sure to keep your API key secret to protect it from abuse. If your key has been exposed publically (say, by
        accidentally being committed to a Github repo) you can generate a new one by clicking on the button above.
      </Text>
    </Stack>
  );
};

export default ApiTokenPage;

export const getServerSideProps = composeNextGSSP(async () => {
  const qc = new QueryClient();

  await qc.prefetchQuery({
    queryKey: userKeys.userApiToken(),
    queryFn: fetchUserApiToken,
  });

  return {
    props: {
      dehydratedState: dehydrate(qc),
    },
  };
});
