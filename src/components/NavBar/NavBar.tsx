import { Box, Flex, Heading, HStack, Icon } from '@chakra-ui/react';
import { ScixAndTextLogo_H_beta } from '@/components/images/ScixAndTextLogo-H_beta';
import dynamic from 'next/dynamic';
import { FC } from 'react';
import { SimpleLink } from '@/components/SimpleLink';

const AppModeDropdown = dynamic<Record<string, never>>(
  () =>
    import('./AppModeDropdown').then((mod) => ({
      default: mod.AppModeDropdown,
    })),
  {
    ssr: false,
  },
);

const NavMenus = dynamic<Record<string, never>>(
  () =>
    import('./NavMenus').then((mod) => ({
      default: mod.NavMenus,
    })),
  { ssr: false },
);

export const NavBar: FC = () => {
  return (
    <Box as="nav" backgroundColor="gray.900">
      <Flex direction="row" alignItems="center" justifyContent="space-between" mx={4} my={2}>
        <HStack spacing={3}>
          <SimpleLink href="/" _hover={{ textDecoration: 'none' }}>
            <HStack cursor="pointer" spacing={1}>
              <Heading as="h1" size="sm">
                <Icon as={ScixAndTextLogo_H_beta} width="6em" height="3em" color="gray.50" aria-label="Scix Home" />
              </Heading>
            </HStack>
          </SimpleLink>
          <AppModeDropdown />
        </HStack>
        <NavMenus />
      </Flex>
    </Box>
  );
};
