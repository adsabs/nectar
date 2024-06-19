import { ChevronDownIcon } from '@chakra-ui/icons';
import { Box, BoxProps, Flex, Menu, MenuButton, MenuItem, MenuList, Stack, Text } from '@chakra-ui/react';
import { CatMenuItems, IMenuItem, IMenuItemProps, SingleMenuItems } from './types';
import { cloneElement } from 'react';
import { SimpleLinkDropdown } from '@/components/Dropdown';
import { ItemType } from '@/components/Dropdown/types';
import { useColorModeColors, useIsClient } from 'src/lib';
import { SimpleLink } from '@/components';

export interface ITopNavigationMenuProps extends BoxProps {
  menuItems: CatMenuItems | SingleMenuItems;
  activeItem: IMenuItem;
}

const TopMenuItem = ({ href, label, icon, rightElement, disabled = false, active = false }: IMenuItemProps) => {
  const colors = useColorModeColors();

  return (
    <MenuItem
      isDisabled={disabled}
      backgroundColor={active ? colors.highlightBackground : 'transparent'}
      mb={1}
      _hover={{ backgroundColor: colors.highlightBackground }}
      as={SimpleLink}
      href={href}
    >
      <Box width="full">
        <Stack direction="row" alignItems="center">
          {icon && cloneElement(icon, { marginright: '16px', width: '18px', 'aria-hidden': true })}
          <Text fontWeight="normal">{label}</Text>
          {rightElement}
        </Stack>
      </Box>
    </MenuItem>
  );
};

/* the dropdown with active item */
const TopMenuButton = ({ label, icon, rightElement }: IMenuItemProps) => {
  return (
    <Flex
      alignItems="center"
      justifyContent="space-between"
      borderRadius="md"
      px={3}
      py={2}
      width="full"
      borderWidth={0.5}
    >
      <Stack direction="row" alignItems="center">
        {icon && cloneElement(icon, { marginright: '16px', width: '18px', 'aria-hidden': true })}
        <Text fontWeight="normal">{label}</Text>
        {rightElement}
      </Stack>
      <ChevronDownIcon fontSize="sm" />
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
        {item.icon && cloneElement(item.icon, { marginright: '16px', width: '18px', 'aria-hidden': true })}
        <Text fontWeight="normal">{item.label}</Text>
        {item.rightElement}
      </Stack>
    ),

    // TODO: need to refactor this so it supports dynamic routes (i.e. linkProps)
    path: item.href.toString(),
    disabled: item.disabled,
  }));

  return (
    <Box as="nav" {...boxProps}>
      <SimpleLinkDropdown items={simpleItems} label={activeItem.label} minListWidth="300px" minLabelWidth="300px" />
    </Box>
  );
};
