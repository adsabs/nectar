import { Box, Heading, Link, Text, VStack } from '@chakra-ui/react';

export const StorageUnavailableNotice = () => {
  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh" px={4}>
      <VStack spacing={6} maxWidth="600px" textAlign="center">
        <Heading as="h1" size="lg">
          Cookies are required
        </Heading>
        <Text>
          SciX uses cookies and site data to maintain your session and preferences. Cookies appear to be blocked by your
          browser settings.
        </Text>
        <Text>To use SciX, enable cookies and site data in your browser:</Text>
        <VStack spacing={2} alignItems="center" width="100%">
          <Link href="https://support.google.com/chrome/answer/95647" isExternal color="blue.500">
            How to enable cookies in Chrome
          </Link>
          <Link
            href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
            isExternal
            color="blue.500"
          >
            How to enable cookies in Firefox
          </Link>
          <Link href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" isExternal color="blue.500">
            How to enable cookies in Safari
          </Link>
        </VStack>
        <Text fontSize="sm" color="gray.500">
          After enabling cookies, reload this page.
        </Text>
      </VStack>
    </Box>
  );
};
