import { Box, Flex, HStack, Link, Text } from '@chakra-ui/layout';
import VisuallyHidden from '@chakra-ui/visually-hidden';
import { NasaLogo, SimpleLink, SmithsonianLogo } from '@components';
import Image from 'next/image';
import NextLink from 'next/link';
import cfaLogo from 'public/images/cfa.png';
import React, { FC } from 'react';

export const Footer: FC = () => {
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
        <Text color="gray.300">adshelp[at]cfa.harvard.edu</Text>
        <Text color="gray.300">
          The{' '}
          <Text as="abbr" title="Astrophysics Data System">
            ADS
          </Text>{' '}
          is operated by the Smithsonian Astrophysical Observatory under{' '}
          <Text as="abbr" title="National Aeronautics and Space Administration">
            NASA
          </Text>{' '}
          Cooperative Agreement 80NSSC21M0056
        </Text>
        <HStack mt={3} spacing={1} my={{ base: '3', md: '0' }}>
          <NextLink href="https://www.nasa.gov" passHref>
            <Link variant="footer" rel="noopener noreferrer">
              <VisuallyHidden as="abbr" title="National Aeronautics and Space Administration">
                NASA
              </VisuallyHidden>
              <NasaLogo width="80px" height="66px" aria-hidden />
            </Link>
          </NextLink>
          <NextLink href="http://www.si.edu/" passHref>
            <Link variant="footer" rel="noopener noreferrer">
              <VisuallyHidden>Smithsonian Institution</VisuallyHidden>
              <SmithsonianLogo width="66px" height="68px" aria-hidden />
            </Link>
          </NextLink>
          <NextLink href="https://www.cfa.harvard.edu/" passHref>
            <Link variant="footer" rel="noopener noreferrer">
              <VisuallyHidden>Center for Astrophysics</VisuallyHidden>
              <Image src={cfaLogo} width="100px" height="41px" aria-hidden alt="" />
            </Link>
          </NextLink>
        </HStack>
      </Flex>
      <Flex direction="column" mx={5} my={{ base: '3', md: '0' }}>
        <Text fontWeight="bold" pb={1}>
          RESOURCES
        </Text>
        <SimpleLink href="/about" variant="footer">
          About{' '}
          <Text as="abbr" title="Astrophysics Data System">
            ADS
          </Text>
        </SimpleLink>
        <SimpleLink href="/help" variant="footer">
          <Text as="abbr" title="Astrophysics Data System">
            ADS
          </Text>{' '}
          Help
        </SimpleLink>
        <SimpleLink href="/help/whats_new" variant="footer">
          What's New
        </SimpleLink>
        <SimpleLink href="/about/careers" variant="footer">
          Careers@ADS
        </SimpleLink>
        <SimpleLink href="/help/accessibility" variant="footer">
          Accessibilty
        </SimpleLink>
      </Flex>
      <Flex direction="column" mx={5} my={{ base: '3', md: '0' }}>
        <Text fontWeight="bold" pb={1}>
          SOCIAL
        </Text>
        <SimpleLink href="https://twitter.com/adsabs" variant="footer">
          @adsabs
        </SimpleLink>
        <SimpleLink href="/blog" variant="footer">
          <Text as="abbr" title="Astrophysics Data System">
            ADS
          </Text>{' '}
          Blog
        </SimpleLink>
      </Flex>
      <Flex direction="column" mx={5} my={{ base: '3', md: '0' }}>
        <Text fontWeight="bold" pb={1}>
          PROJECT
        </Text>
        <SimpleLink href="https://ui.adsabs.harvard.edu/help/privacy/" variant="footer">
          Privacy Policy
        </SimpleLink>
        <SimpleLink href="https://ui.adsabs.harvard.edu/help/terms" variant="footer">
          Terms of Use
        </SimpleLink>
        <SimpleLink href="http://www.cfa.harvard.edu/sao" variant="footer">
          Smithsonian Astrophysical Observatory
        </SimpleLink>
        <SimpleLink href="http://www.si.edu/" variant="footer">
          Smithsonian Institution
        </SimpleLink>
        <SimpleLink href="http://www.nasa.gov/" variant="footer">
          <Text as="abbr" title="National Aeronautics and Space Administration">
            NASA
          </Text>
        </SimpleLink>
      </Flex>
    </Box>
  );
};
