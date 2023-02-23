import { cloneElement } from 'react';
import NextLink from 'next/link';
import { Box, BoxProps, Button, Flex, Text } from '@chakra-ui/react';
import { CatMenuItems, IMenuItem, IMenuItemProps, SingleMenuItems } from './types';

export interface ISideNavigationMenuProps extends BoxProps {
  menuItems: CatMenuItems | SingleMenuItems;
  activeItem: IMenuItem;
}

/**
 * Menu item rendered as as button link
 */
const SideMenuItem = ({ href, hrefAs, label, icon, active = false, disabled = false }: IMenuItemProps) => {
  return (
    <NextLink href={href} as={hrefAs} passHref legacyBehavior>
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
        isDisabled={disabled}
        leftIcon={icon ? cloneElement(icon, { className: 'w-6 h-6', 'aria-hidden': true }) : null}
      >
        {label}
      </Button>
    </NextLink>
  );
};

export const SideNavigationMenu = ({ menuItems, activeItem, ...boxProps }: ISideNavigationMenuProps) => {
  // categoried menu
  if (!Array.isArray(menuItems)) {
    const catMenuItems = menuItems as unknown as CatMenuItems;
    return (
      <Box as="nav" aria-label="sidebar" shadow="md" borderRadius="md" {...boxProps}>
        {Object.entries(catMenuItems).map(([category, items]) => (
          <Flex direction="column" alignItems="start" justifyContent="start" px={2} key={category}>
            <Text fontSize="xs" fontWeight="bold" py={2}>
              {category}
            </Text>
            {items.map((item) => (
              <SideMenuItem key={item.id} {...item} active={item.id === activeItem.id} />
            ))}
          </Flex>
        ))}
      </Box>
    );
  }
  // Single list menu
  return (
    <Box as="nav" aria-label="sidebar" {...boxProps}>
      <Flex direction="column" alignItems="start" justifyContent="start" shadow="md" borderRadius="md" p={2}>
        {Object.values(menuItems).map((item) => (
          <SideMenuItem key={item.id} {...item} active={item.id === activeItem.id} />
        ))}
      </Flex>
    </Box>
  );
};