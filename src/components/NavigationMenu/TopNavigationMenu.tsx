import { ChevronDownIcon } from '@chakra-ui/icons';
import { Box, MenuItem, Flex, Menu, MenuButton, MenuList, Text, BoxProps, Stack } from '@chakra-ui/react';
import { CatMenuItems, IMenuItem, IMenuItemProps, SingleMenuItems } from './types';
import NextLink from 'next/link';
import { cloneElement } from 'react';
import { SimpleLinkDropdown } from '@components/Dropdown';
import { ItemType } from '@components/Dropdown/types';
import { useIsClient } from '@hooks';

export interface ITopNavigationMenuProps extends BoxProps {
  menuItems: CatMenuItems | SingleMenuItems;
  activeItem: IMenuItem;
}

const TopMenuItem = ({ href, hrefAs, label, icon, rightElement, disabled = false, active = false }: IMenuItemProps) => {
  return (
    <MenuItem
      isDisabled={disabled}
      backgroundColor={active ? 'gray.100' : 'transparent'}
      mb={1}
      _hover={{ backgroundColor: 'gray.100' }}
    >
      <NextLink href={href} as={hrefAs} passHref>
        <Box width="full" color="gray.700">
          <Stack direction="row" alignItems="center">
            {icon && cloneElement(icon, { className: 'mr-3 w-6 h-6', 'aria-hidden': true })}
            <Text fontWeight="normal">{label}</Text>
            {rightElement}
          </Stack>
        </Box>
      </NextLink>
    </MenuItem>
  );
};

/* the dropdown with active item */
const TopMenuButton = ({ label, icon, rightElement }: IMenuItemProps) => {
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
      <Stack direction="row" alignItems="center">
        {icon && cloneElement(icon, { className: 'mr-3 w-6 h-6', 'aria-hidden': true })}
        <Text fontWeight="normal">{label}</Text>
        {rightElement}
      </Stack>
      <ChevronDownIcon className="w-6 h-6" />
    </Flex>
  );
};

export const TopNavigationMenu = (props: ITopNavigationMenuProps) => {
  const isClient = useIsClient();
  return isClient ? <TopNavigationMenuComponent {...props} /> : <Static {...props} />;
};

const TopNavigationMenuComponent = ({ menuItems, activeItem, ...boxProps }: ITopNavigationMenuProps) => {
  return (
    <Box as="nav" {...boxProps}>
      <Menu matchWidth>
        <MenuButton width="full">
          <TopMenuButton {...activeItem} />
        </MenuButton>
        <MenuList>
          {Array.isArray(menuItems)
            ? Object.values(menuItems).map((item) => <TopMenuItem key={item.id} {...item} />)
            : Object.entries(menuItems).map(([category, menuItems]) => (
                <span key={category}>
                  <Text fontSize="xs" fontWeight="bold" p={2}>
                    {category}
                  </Text>
                  {menuItems.map((item) => (
                    <TopMenuItem key={item.id} {...item} active={item.id === activeItem.id} />
                  ))}
                </span>
              ))}
        </MenuList>
      </Menu>
    </Box>
  );
};

/**
 * Static component for non-js
 * This component will be rendered on the server by default
 */
const Static = ({ menuItems, activeItem, ...boxProps }: ITopNavigationMenuProps) => {
  const flatMenuItems = Array.isArray(menuItems) ? menuItems : Object.values(menuItems).flat();
  const simpleItems: ItemType[] = flatMenuItems.map((item) => ({
    id: item.id as string,
    label: (
      <Stack direction="row" alignItems="center">
        {item.icon && cloneElement(item.icon, { className: 'mr-3 w-6 h-6', 'aria-hidden': true })}
        <Text fontWeight="normal">{item.label}</Text>
        {item.rightElement}
      </Stack>
    ),

    // TODO: need to refactor this so it supports dynamic routes (i.e. linkProps)
    path: item.hrefAs,
    disabled: item.disabled,
  }));

  return (
    <Box as="nav" {...boxProps}>
      <SimpleLinkDropdown items={simpleItems} label={activeItem.label} minListWidth="300px" minLabelWidth="300px" />
    </Box>
  );
};