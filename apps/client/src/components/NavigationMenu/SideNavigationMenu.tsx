import { cloneElement } from 'react';
import { Box, BoxProps, Button, Flex, Text } from '@chakra-ui/react';
import { CatMenuItems, IMenuItem, IMenuItemProps, SingleMenuItems } from './types';
import { useColorModeColors } from '@/lib';
import { SimpleLink } from '@/components';

export interface ISideNavigationMenuProps extends BoxProps {
  menuItems: CatMenuItems | SingleMenuItems;
  activeItem: IMenuItem;
}

/**
 * Menu item rendered as button link
 */
const SideMenuItem = ({ href, label, icon, active = false, disabled = false, rightElement = null }: IMenuItemProps) => {
  const colors = useColorModeColors();

  return (
    <>
      {disabled ? (
        <Button
          as={SimpleLink}
          href={href}
          w="full"
          variant={active ? 'solid' : 'ghost'}
          size="md"
          aria-current={active ? 'page' : undefined}
          justifyContent="start"
          colorScheme="gray"
          mb={1}
          color={colors.disalbedText}
          fontSize="normal"
          fontWeight="normal"
          isDisabled
          leftIcon={icon ? cloneElement(icon, { width: '18px', 'aria-hidden': true }) : null}
        >
          <Flex direction="row" alignItems="center" justifyContent="space-between" w="full">
            <>{label}</>
            <>{rightElement}</>
          </Flex>
        </Button>
      ) : (
        <Button
          as={SimpleLink}
          href={href}
          w="full"
          variant={active ? 'solid' : 'ghost'}
          size="md"
          aria-current={active ? 'page' : undefined}
          justifyContent="start"
          colorScheme="gray"
          mb={1}
          color={colors.text}
          fontSize="normal"
          fontWeight="normal"
          leftIcon={icon ? cloneElement(icon, { width: '18px', 'aria-hidden': true }) : null}
        >
          <Flex direction="row" alignItems="center" justifyContent="space-between" w="full">
            <>{label}</>
            <>{rightElement}</>
          </Flex>
        </Button>
      )}
    </>
  );
};

export const SideNavigationMenu = ({ menuItems, activeItem, ...boxProps }: ISideNavigationMenuProps) => {
  // categorized menu
  if (!Array.isArray(menuItems)) {
    const catMenuItems = menuItems as unknown as CatMenuItems;
    return (
      <Box as="nav" aria-label="sidebar" shadow="md" borderRadius="md" {...boxProps}>
        {Object.entries(catMenuItems).map(([category, items]) => (
          <Flex direction="column" alignItems="start" justifyContent="start" px={2} key={category} w="full">
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
      <Flex direction="column" alignItems="start" justifyContent="start" shadow="md" borderRadius="md" p={2} w="full">
        {Object.values(menuItems).map((item) => (
          <SideMenuItem key={item.id} {...item} active={item.id === activeItem.id} />
        ))}
      </Flex>
    </Box>
  );
};
