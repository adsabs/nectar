import { Box, Flex, HStack, Icon, Link } from '@chakra-ui/react';
import { ScixAndTextLogo_H_beta } from '@components/images/ScixAndTextLogo-H_beta';
import dynamic from 'next/dynamic';
import NextLink from 'next/link';
import { FC } from 'react';

const AppModeDropdown = dynamic<Record<string, never>>(
  () => import('./AppModeDropdown').then((mod) => mod.AppModeDropdown),
  {
    ssr: false,
  },
);

const NavMenus = dynamic<Record<string, never>>(() => import('./NavMenus').then((mod) => mod.NavMenus), { ssr: false });

export const NavBar: FC = () => {
  return (
    <Box as="nav" backgroundColor="gray.900">
      <Flex direction="row" alignItems="center" justifyContent="space-between" mx={4} my={2}>
        <HStack spacing={3}>
          <NextLink href="/" passHref legacyBehavior>
            <Link _hover={{ textDecoration: 'none' }}>
              <HStack cursor="pointer" spacing={1}>
                <Icon as={ScixAndTextLogo_H_beta} width="6em" height="3em" color="gray.50" aria-label="Scix Home" />
              </HStack>
            </Link>
          </NextLink>
          <AppModeDropdown />
        </HStack>
        <NavMenus />
      </Flex>
    </Box>
  );
};
