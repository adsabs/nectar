import { NasaLogo, SmithsonianLogo } from '@components';
import Image from 'next/image';
import NextLink from 'next/link';
import cfaLogo from 'public/img/cfa.png';
import React, { FC, ReactElement } from 'react';
import { Box, Flex, HStack, Link, Text } from '@chakra-ui/layout';
import VisuallyHidden from '@chakra-ui/visually-hidden';

const SimpleLink: FC<{ href: string; icon?: ReactElement }> = ({ children, href, icon }) => {
  const isExternal = /^http(s)/.exec(href);

  return (
    <NextLink href={href} passHref>
      <Link variant="footer" display="block" rel={isExternal ? 'noopener noreferrer' : undefined}>
        {icon && <>{icon}</>}
        {children}
      </Link>
    </NextLink>
  );
};

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
        <SimpleLink href="/about">
          About{' '}
          <Text as="abbr" title="Astrophysics Data System">
            ADS
          </Text>
        </SimpleLink>
        <SimpleLink href="/help">
          <Text as="abbr" title="Astrophysics Data System">
            ADS
          </Text>{' '}
          Help
        </SimpleLink>
        <SimpleLink href="/help/whats_new">What's New</SimpleLink>
        <SimpleLink href="/about/careers">Careers@ADS</SimpleLink>
        <SimpleLink href="/help/accessibility">Accessibilty</SimpleLink>
      </Flex>
      <Flex direction="column" mx={5} my={{ base: '3', md: '0' }}>
        <Text fontWeight="bold" pb={1}>
          SOCIAL
        </Text>
        <SimpleLink href="https://twitter.com/adsabs">@adsabs</SimpleLink>
        <SimpleLink href="/blog">
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
        <SimpleLink href="https://ui.adsabs.harvard.edu/help/privacy/">Privacy Policy</SimpleLink>
        <SimpleLink href="https://ui.adsabs.harvard.edu/help/terms">Terms of Use</SimpleLink>
        <SimpleLink href="http://www.cfa.harvard.edu/sao">Smithsonian Astrophysical Observatory</SimpleLink>
        <SimpleLink href="http://www.si.edu/">Smithsonian Institution</SimpleLink>
        <SimpleLink href="http://www.nasa.gov/">
          <Text as="abbr" title="National Aeronautics and Space Administration">
            NASA
          </Text>
        </SimpleLink>
      </Flex>
    </Box>
  );
};
