import { Box, Flex, HStack, Text, VisuallyHidden } from '@chakra-ui/react';
import { CFALogo, NasaLogo, SimpleLink, SmithsonianLogo } from '@components';
import { FC } from 'react';
import { EXTERNAL_URLS } from '@config';
import { ExternalLinkIcon } from '@chakra-ui/icons';

export const Footer: FC = () => {
  // TODO: darkmode will invert logo colors, need to swap out for high contrast instead

  return (
    <Box
      as="footer"
      mt={3}
      py={6}
      display="flex"
      flexDirection={{ base: 'column', md: 'row' }}
      justifyContent="space-between"
    >
      <Flex direction="column" width={80} mx={5}>
        <Text fontWeight="semibold">
          © The{' '}
          <Text as="abbr" title="Smithsonian Astrophysical Observatory">
            SAO
          </Text>
          /
          <Text as="abbr" title="National Aeronautics and Space Administration">
            NASA
          </Text>{' '}
          Data System
        </Text>
        <Text color="gray.300">help[at]scixplorer.org</Text>
        <Text color="gray.300" mt={3}>
          SciX is a project created by the Astrophysics Data System (ADS), which is operated by the Smithsonian
          Astrophysical Observatory under{' '}
          <Text as="abbr" title="National Aeronautics and Space Administration">
            NASA
          </Text>{' '}
          Cooperative Agreement 80NSSC21M0056.
        </Text>
        <HStack my={3} spacing={1}>
          <SimpleLink href={EXTERNAL_URLS.NASA_HOME_PAGE} variant="footer">
            <VisuallyHidden as="abbr" title="National Aeronautics and Space Administration">
              NASA
            </VisuallyHidden>
            <NasaLogo width="80px" height="66px" aria-hidden />
          </SimpleLink>
          <SimpleLink href={EXTERNAL_URLS.SMITHSONIAN_HOME_PAGE} variant="footer">
            <VisuallyHidden>Smithsonian Institution</VisuallyHidden>
            <SmithsonianLogo width="66px" height="68px" aria-hidden />
          </SimpleLink>
          <SimpleLink href={EXTERNAL_URLS.CFA_HOME_PAGE}>
            <VisuallyHidden>Center for Astrophysics</VisuallyHidden>
            <CFALogo width="100px" height="41px" style={{ filter: 'invert(1)' }} aria-hidden />
          </SimpleLink>
        </HStack>
      </Flex>
      <Flex direction="column" mx={5} my={{ base: '3', md: '0' }}>
        <Text fontWeight="bold" pb={1}>
          RESOURCES
        </Text>
        <SimpleLink href="/scixabout" variant="footer">
          About SciX
        </SimpleLink>
        <SimpleLink href="/feedback/general" variant="footer">
          Give Feedback
        </SimpleLink>
        <SimpleLink href="/scixhelp" variant="footer">
          SciX Help
        </SimpleLink>
        <SimpleLink href="/about/careers" variant="footer">
          Careers@ADS
        </SimpleLink>
        <SimpleLink href="/help/accessibility" variant="footer">
          Accessibility
        </SimpleLink>
        <SimpleLink href={EXTERNAL_URLS.NASA_SDE_HOME_PAGE} variant="footer">
          NASA Science Discovery Engine <ExternalLinkIcon mx="2px" />
        </SimpleLink>
      </Flex>
      <Flex direction="column" mx={5} my={{ base: '3', md: '0' }}>
        <Text fontWeight="bold" pb={1}>
          SOCIAL
        </Text>
        <SimpleLink href={EXTERNAL_URLS.TWITTER_SCIX} variant="footer">
          @scixcommunity <ExternalLinkIcon mx="2px" />
        </SimpleLink>
        <SimpleLink href="/scixblog" variant="footer">
          SciX Blog
        </SimpleLink>
      </Flex>
      <Flex direction="column" mx={5} my={{ base: '3', md: '0' }}>
        <Text fontWeight="bold" pb={1}>
          PROJECT
        </Text>
        <SimpleLink href="/help/privacy/" variant="footer">
          Privacy Policy
        </SimpleLink>
        <SimpleLink href="/help/terms" variant="footer">
          Terms of Use
        </SimpleLink>
        <SimpleLink href={EXTERNAL_URLS.CFA_SAO_HOME_PAGE} variant="footer">
          Smithsonian Astrophysical Observatory
          <ExternalLinkIcon mx="2px" />
        </SimpleLink>
        <SimpleLink href={EXTERNAL_URLS.SMITHSONIAN_HOME_PAGE} variant="footer">
          Smithsonian Institution <ExternalLinkIcon mx="2px" />
        </SimpleLink>
        <SimpleLink href={EXTERNAL_URLS.NASA_HOME_PAGE} variant="footer">
          <Text as="abbr" title="National Aeronautics and Space Administration">
            NASA <ExternalLinkIcon mx="2px" />
          </Text>
        </SimpleLink>
      </Flex>
    </Box>
  );
};
