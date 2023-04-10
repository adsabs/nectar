import { useGetToken } from '@api';
import { generateNewApiToken } from '@auth-utils';

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
  Input,
  InputGroup,
  InputLeftAddon,
  InputRightAddon,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { CopyButton, SettingsLayout, SimpleLink } from '@components';
import { GetServerSideProps, GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { useEffect, useRef, useState } from 'react';
import { composeNextGSSP } from '@ssrUtils';

const ApiTokenPage = ({}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();

  // fetch token
  const { data } = useGetToken({});
  const [token, setToken] = useState('');

  useEffect(() => {
    if (data) {
      setToken(data.access_token);
    }
  }, [data]);

  const handleGenerateToken = () => {
    onClose();
    (async () => {
      const res = await generateNewApiToken();
      if (typeof res === 'string') {
        toast({ title: Error, status: 'error', description: res });
      } else {
        setToken(res.access_token);
      }
    })();
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
      <Stack direction="column" gap={2}>
        <InputGroup size="md">
          <InputLeftAddon children={<CopyButton text={token} />} />
          <Input type="text" name="token" id="token" value={token} autoFocus isReadOnly />
          <InputRightAddon
            children="Generate New Token"
            bgColor="blue.500"
            color="gray.50"
            borderColor="blue.500"
            borderRightRadius="sm"
            cursor="pointer"
            onClick={onOpen}
          />
        </InputGroup>
        <Text>
          This API token allows you to access ADS data programmatically. For instance, to fetch the first few bibcodes
          for the query "star", make the following request:
        </Text>
        <Code my={2}>
          {`curl -H 'Authorization: Bearer:${token}'
          'https://api.adsabs.harvard.edu/v1/search/query?q=star&fl=bibcode'`}
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
});
