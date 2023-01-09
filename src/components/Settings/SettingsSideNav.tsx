import { ChevronDownIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, Menu, MenuButton, MenuItem, MenuList, Stack, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { concat } from 'ramda';

const settingsPath = '/user/settings';
interface IMenuItemProps {
  route: string;
  label: string;
}

const menuItems = {
  'USER PREFERENCES': [
    {
      route: 'libraryimport',
      label: 'Import Libraries',
    },
    {
      route: 'librarylink',
      label: 'Library Link Server',
    },
    {
      route: 'orcid',
      label: 'ORCiD',
    },
    {
      route: 'application',
      label: 'Search',
    },
    {
      route: 'export',
      label: 'Export',
    },
  ],
  'ACCOUNT SETTINGS': [
    {
      route: 'email',
      label: 'Change Email',
    },
    {
      route: 'password',
      label: 'Change Password',
    },
    {
      route: 'token',
      label: 'API Token',
    },
    {
      route: 'delete',
      label: 'Delete Account',
    },
  ],
};

/**
 * Basic item
 * Rendered as as button link
 */
const SideMenuItem = ({ route, label }: IMenuItemProps) => {
  const router = useRouter();
  const active = router.asPath.indexOf(`/${route}`) > -1;

  return (
    <NextLink
      href={{ pathname: `${settingsPath}/${route}` }}
      as={{ pathname: `${settingsPath}/${route}` }}
      passHref
      legacyBehavior
    >
      <Button
        as="a"
        w="full"
        variant={active ? 'solid' : 'ghost'}
        size="md"
        aria-current={active ? 'page' : undefined}
        width="full"
        justifyContent="start"
        colorScheme="gray"
        mb={1}
        color="gray.700"
        fontSize="normal"
        fontWeight="normal"
      >
        {label}
      </Button>
    </NextLink>
  );
};

const TopMenuItem = ({ route, label }: IMenuItemProps) => {
  const router = useRouter();
  const active = router.asPath.indexOf(`/${route}`) > -1;

  return (
    <MenuItem backgroundColor={active ? 'gray.100' : 'transparent'} mb={1} _hover={{ backgroundColor: 'gray.100' }}>
      <NextLink href={`${settingsPath}/${route}`} as={`${settingsPath}/${route}`} passHref>
        <Box width="full" color="gray.700">
          <Text fontWeight="normal">{label}</Text>
        </Box>
      </NextLink>
    </MenuItem>
  );
};

const TopMenuButton = ({ label }: IMenuItemProps) => {
  return (
    <Flex
      alignItems="center"
      justifyContent="space-between"
      backgroundColor="gray.50"
      borderRadius="md"
      px={3}
      py={2}
      width="full"
    >
      <Text>{label}</Text>
      <ChevronDownIcon className="w-6 h-6" />
    </Flex>
  );
};

export const SettingsSideNav = () => {
  const router = useRouter();
  const activeItem = Object.values(menuItems)
    .flat()
    .find((item) => router.asPath.indexOf(`/${item.route}`) > -1);

  return (
    <>
      {/* Large viewports */}
      <Box as="nav" aria-label="sidebar" display={{ base: 'none', lg: 'initial' }} shadow="md" borderRadius="md" my={2}>
        {Object.entries(menuItems).map(([category, items]) => (
          <Flex direction="column" alignItems="start" justifyContent="start" px={2} key={category}>
            <Text fontSize="xs" fontWeight="bold" py={2}>
              {category}
            </Text>
            {items.map((item) => (
              <SideMenuItem key={item.route} {...item} />
            ))}
          </Flex>
        ))}
      </Box>

      {/* Small viewports */}
      <Box as="nav" display={{ base: 'initial', lg: 'none' }} mx={2}>
        <Menu matchWidth>
          <MenuButton width="full">
            <TopMenuButton {...activeItem} />
          </MenuButton>
          <MenuList>
            {Object.entries(menuItems).map(([category, items]) => (
              <span key={category}>
                <Text fontSize="xs" fontWeight="bold" p={2}>
                  {category}
                </Text>
                {items.map((item) => (
                  <TopMenuItem key={item.route} {...item} />
                ))}
              </span>
            ))}
          </MenuList>
        </Menu>
      </Box>
    </>
  );
};
