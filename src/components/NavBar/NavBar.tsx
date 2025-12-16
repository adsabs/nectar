import { Box, DarkMode, Flex, Heading, HStack, Icon, Text } from '@chakra-ui/react';
import { ScixAndTextLogo_H } from '@/components/images/ScixAndTextLogo-H';
import dynamic from 'next/dynamic';
import { FC } from 'react';
import { SimpleLink } from '@/components/SimpleLink';
import { AdsModeToggle } from './AdsModeToggle';
import { AppModeUrlNotice } from './AppModeUrlNotice';
import { useStore } from '@/store';
import { ByADSModes } from '@/types';

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
  const mode = useStore((state) => state.mode);

  return (
    <Box as="nav" backgroundColor="gray.900" position="relative" zIndex="overlay">
      <Flex direction="row" alignItems="center" justifyContent="space-between" mx={4} my={2}>
        <HStack spacing={3}>
          <SimpleLink href="/" _hover={{ textDecoration: 'none' }}>
            <HStack cursor="pointer" spacing={1}>
              <DarkMode>
                <Heading as="h1" size="sm">
                  <Flex direction="column" alignItems="end">
                    <Icon as={ScixAndTextLogo_H} width="6em" height="3em" color="gray.50" aria-label="Scix Home" />
                    {ByADSModes.includes(mode) ? (
                      <Text color="chakra-body-text" fontSize={'xs'} mt={-3}>
                        by ADS
                      </Text>
                    ) : null}
                  </Flex>
                </Heading>
              </DarkMode>
            </HStack>
          </SimpleLink>
          <AppModeDropdown />
          <AppModeUrlNotice />
        </HStack>
        <HStack>
          <AdsModeToggle source="navbar" />
          <NavMenus />
        </HStack>
      </Flex>
    </Box>
  );
};
