import { Box, DarkMode, Flex, Heading, HStack, Icon, Text } from '@chakra-ui/react';
import { ScixAndTextLogo_H } from '@/components/images/ScixAndTextLogo-H';
import dynamic from 'next/dynamic';
import { FC } from 'react';
import { SimpleLink } from '@/components/SimpleLink';
import { AppModeUrlNotice } from './AppModeUrlNotice';
import { useStore } from '@/store';
import { ByADSModes } from '@/types';
import { useLandingFormPreference } from '@/lib/useLandingFormPreference';

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
  const { landingFormUrl } = useLandingFormPreference();

  return (
    <Box as="nav" backgroundColor="gray.900" position="relative" zIndex="overlay">
      <Flex direction="row" alignItems="center" justifyContent="space-between" mx={{ base: 2, sm: 4 }} my={2}>
        <HStack spacing={{ base: 1, sm: 3 }} flexShrink={1} minW={0}>
          <SimpleLink href={landingFormUrl} _hover={{ textDecoration: 'none' }} flexShrink={0}>
            <HStack cursor="pointer" spacing={1}>
              <DarkMode>
                <Heading as="h1" size="sm">
                  <Flex direction="column" alignItems="end">
                    <Icon
                      as={ScixAndTextLogo_H}
                      width={{ base: '4.5em', sm: '6em' }}
                      height={{ base: '2.25em', sm: '3em' }}
                      color="gray.50"
                      aria-label="Scix Home"
                    />
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
          <Box display={{ base: 'none', md: 'block' }}>
            <AppModeDropdown />
          </Box>
          <AppModeUrlNotice />
        </HStack>
        <HStack flexShrink={0}>
          <NavMenus />
        </HStack>
      </Flex>
    </Box>
  );
};
