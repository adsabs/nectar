import { ChevronDownIcon } from '@chakra-ui/icons';
import { HStack, List, ListItem, Menu, MenuButton, MenuDivider, MenuItem, MenuList } from '@chakra-ui/react';
import { ItemType, ListType } from './types';
import { isBrowser } from '@utils';
import { KeyboardEvent, MouseEventHandler, ReactNode } from 'react';

interface IMenuDropdownProps {
  id: string;
  type: ListType;
  label: ReactNode | string;
  items: ItemType[];
  hideChevron?: boolean;
  onSelect: MouseEventHandler<HTMLButtonElement | HTMLLIElement>;
}

export const MenuDropdown = (props: IMenuDropdownProps) => {
  const { id, type, label, items, onSelect, hideChevron } = props;

  const handleKeydown = (e: KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusItem(index + 1);
        return;
      case 'ArrowUp':
        e.preventDefault();
        focusItem(index - 1);
        return;
    }
  };

  const focusItem = (index: number) => {
    const numItems = items.length;
    const idx = index >= numItems ? 0 : index < 0 ? numItems - 1 : index;
    const item = items[idx];
    if (isBrowser() && item !== 'divider') {
      document.getElementById(`${id}-item-${item.id}`).focus();
    }
  };

  return type === ListType.DROPDOWN ? (
    <Menu variant="navbar">
      <MenuButton>
        <HStack>
          <>{label}</> {hideChevron ? null : <ChevronDownIcon />}
        </HStack>
      </MenuButton>
      <MenuList zIndex={500}>
        {items.map((item) => (
          <>
            {item === 'divider' ? (
              <MenuDivider />
            ) : (
              <MenuItem key={item.id} onClick={onSelect} data-id={item.id} {...item?.menuItemProps}>
                {item.label}
              </MenuItem>
            )}
          </>
        ))}
      </MenuList>
    </Menu>
  ) : (
    <List variant="navbar" role="menu">
      {items.map((item, index) => (
        <>
          {item !== 'divider' && (
            <ListItem
              key={item.id}
              role="menuitem"
              id={`${id}-item-${item.id}`}
              onClick={onSelect}
              data-id={item.id}
              tabIndex={0}
              onKeyDown={(e) => handleKeydown(e, index)}
            >
              {item.label}
            </ListItem>
          )}
        </>
      ))}
    </List>
  );
};
