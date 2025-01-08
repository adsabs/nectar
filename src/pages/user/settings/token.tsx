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
  InputGroup,
  InputLeftAddon,
  Spinner,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';

import { Suspense, useRef } from 'react';
import { dehydrate, QueryClient, QueryErrorResetBoundary, useQueryClient } from '@tanstack/react-query';

import { ErrorBoundary } from 'react-error-boundary';
import { getFallBackAlert } from '@/components/Feedbacks/SuspendedAlert';
import { composeNextGSSP } from '@/ssr-utils';
import { logger } from '@/logger';
import { SimpleCopyButton } from '@/components/CopyButton';
import { SettingsLayout } from '@/components/Layout';
import { StandardAlertMessage } from '@/components/Feedbacks';
import { PasswordTextInput } from '@/components/TextInput';
import { SimpleLink } from '@/components/SimpleLink';
import { fetchUserApiToken, useGenerateNewApiToken, useGetUserApiToken, userKeys } from '@/api/user/user';

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
      <Stack direction="row" spacing={0}>
        <InputGroup size="md">
          <InputLeftAddon>
            <SimpleCopyButton text={data?.access_token} />
          </InputLeftAddon>
          <PasswordTextInput name="token" id="token" value={data?.access_token} autoFocus isReadOnly />
        </InputGroup>
        <Button
          borderLeftRadius="0"
          borderRightRadius="md"
          size="md"
          onClick={onGenerate}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              onGenerate();
            }
          }}
        >
          {isLoading ? <Spinner size="sm" /> : 'Generate New Token'}
        </Button>
      </Stack>
      {!!data?.access_token && (
        <>
          <Text>
            This API token allows you to access ADS data programmatically. For instance, to fetch the first few bibcodes
            for the query &#34;star&#34;, make the following request:
          </Text>
          <Heading size="sm" as="h2">
            API Usage
          </Heading>
          <Stack direction={{ base: 'column', xs: 'row' }}>
            <Code>
              {
                "curl -H 'Authorization: Bearer *************************' https://api.adsabs.harvard.edu/v1/search/query?q=star&fl=bibcode"
              }
            </Code>
            <SimpleCopyButton
              variant="solid"
              text={`curl -H 'Authorization: Bearer ${
                data?.access_token ?? ''
              }' https://api.adsabs.harvard.edu/v1/search/query?q=star&fl=bibcode`}
            />
          </Stack>
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

  try {
    await qc.prefetchQuery({
      queryKey: userKeys.userApiToken(),
      queryFn: fetchUserApiToken,
    });

    return {
      props: {
        dehydratedState: dehydrate(qc),
      },
    };
  } catch (error) {
    logger.error({ msg: 'GSSP on token settings page', error });
    return {
      props: { pageError: error },
    };
  }
});
