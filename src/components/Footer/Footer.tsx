import { Box, Flex, HStack, Text, VisuallyHidden } from '@chakra-ui/react';

import { FC } from 'react';
import { EXTERNAL_URLS } from '@/config';
import { SimpleLink } from '@/components/SimpleLink';
import { CFALogo, NASAPartnerLogo, SmithsonianLogo } from '@/components/images';

export const Footer: FC = () => {
  return (
    <Box
      as="footer"
      mt={3}
      py={6}
      display="flex"
      flexDirection={{ base: 'column', md: 'row' }}
      justifyContent="space-between"
      backgroundColor="gray.900"
      color="gray.50"
      sx={{ a: { color: 'gray.50' } }}
    >
      <Flex direction="column" width="96" mx={5}>
        <Text fontWeight="semibold">
          © The{' '}
          <Text as="abbr" title="Smithsonian Astrophysical Observatory">
            SAO
          </Text>{' '}
          Astrophysics Data System
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

        <HStack my={3} spacing={4}>
          <SimpleLink href={EXTERNAL_URLS.SMITHSONIAN_HOME_PAGE} variant="footer" isExternal>
            <VisuallyHidden>Smithsonian Institution</VisuallyHidden>
            <SmithsonianLogo width="72.6px" height="72.6px" aria-hidden />
          </SimpleLink>
          <SimpleLink href={EXTERNAL_URLS.CFA_HOME_PAGE} variant="footer" isExternal>
            <VisuallyHidden>Center for Astrophysics</VisuallyHidden>
            <CFALogo width="121px" height="48.4px" style={{ filter: 'invert(1)' }} aria-hidden />
          </SimpleLink>
          <SimpleLink href={EXTERNAL_URLS.NASA_HOME_PAGE} variant="footer" isExternal>
            <VisuallyHidden as="abbr" title="National Aeronautics and Space Administration">
              NASA
            </VisuallyHidden>
            <NASAPartnerLogo width="96.8px" height="72.89px" aria-hidden />
          </SimpleLink>
        </HStack>

        <Text fontStyle="italic" fontSize="xx-small">
          *The material contained in this document is based upon work supported by a National Aeronautics and Space
          Administration (NASA) grant or cooperative agreement. Any opinions, findings, conclusions or recommendations
          expressed in this material are those of the author and do not necessarily reflect the views of NASA.
        </Text>
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
        <SimpleLink href="/scixabout/careers" variant="footer">
          Careers@SciX
        </SimpleLink>
        <SimpleLink href="/help/accessibility" variant="footer">
          Web Accessibility Policy
        </SimpleLink>
        <SimpleLink href={EXTERNAL_URLS.NASA_SDE_HOME_PAGE} variant="footer" isExternal>
          NASA Science Discovery Engine
        </SimpleLink>
      </Flex>
      <Flex direction="column" mx={5} my={{ base: '3', md: '0' }}>
        <Text fontWeight="bold" pb={1}>
          SOCIAL
        </Text>
        <SimpleLink href={EXTERNAL_URLS.TWITTER_SCIX} variant="footer">
          @scixcommunity
        </SimpleLink>
        <SimpleLink href="/scixblog" variant="footer">
          SciX Blog
        </SimpleLink>
      </Flex>
      <Flex direction="column" mx={5} my={{ base: '3', md: '0' }}>
        <Text fontWeight="bold" pb={1}>
          PROJECT
        </Text>
        <SimpleLink href="/help/privacy" variant="footer">
          Privacy Policy
        </SimpleLink>
        <SimpleLink href="/help/terms" variant="footer">
          Terms of Use
        </SimpleLink>
        <SimpleLink href={EXTERNAL_URLS.CFA_SAO_HOME_PAGE} variant="footer">
          Smithsonian Astrophysical Observatory
        </SimpleLink>
        <SimpleLink href={EXTERNAL_URLS.SMITHSONIAN_HOME_PAGE} variant="footer">
          Smithsonian Institution
        </SimpleLink>
        <SimpleLink href={EXTERNAL_URLS.NASA_HOME_PAGE} variant="footer">
          <Text as="abbr" title="National Aeronautics and Space Administration">
            NASA
          </Text>
        </SimpleLink>
      </Flex>
    </Box>
  );
};
