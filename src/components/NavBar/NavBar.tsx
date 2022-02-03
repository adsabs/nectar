import { Heading, HStack, Box, Link, Flex } from '@chakra-ui/layout';
import { AdsSmallLogo } from '@components/images';
import dynamic from 'next/dynamic';
import NextLink from 'next/link';
import { FC } from 'react';

const ThemeDropdown = dynamic(() => import('./ThemeDropdown').then((mod) => mod.ThemeDropdown), { ssr: false });

const NavMenus = dynamic(() => import('./NavMenus').then((mod) => mod.NavMenus), { ssr: false });

export const NavBar: FC = () => {
  return (
    <Box as="nav" backgroundColor="gray.900">
      <Flex direction="row" alignItems="center" justifyContent="space-between" spacing={3} mx={4} my={2}>
        <HStack spacing={3}>
          <NextLink href="/" passHref>
            <Link _hover={{ textDecoration: 'none' }}>
              <HStack cursor="pointer" spacing={1}>
                <AdsSmallLogo className="w-10 h-10" aria-hidden />
                <Heading
                  as="h1"
                  size="lg"
                  tabIndex={0}
                  color="gray.50"
                  _focus={{ boxShadow: 'outline', outline: 'none' }}
                  display={{ base: 'none', sm: 'initial' }}
                >
                  SciX
                </Heading>
              </HStack>
            </Link>
          </NextLink>
          <ThemeDropdown />
        </HStack>
        <Link href="#main-content" color="gray.50" className="focus:not-sr-only sr-only">
          Skip to content
        </Link>
        <NavMenus />
      </Flex>
    </Box>
  );
};
