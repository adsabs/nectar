import { ChevronDownIcon } from '@chakra-ui/icons';
import { Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/menu';
import { HStack, List, ListItem } from '@chakra-ui/layout';
import { ListType, ItemType } from './types';
import { isBrowser } from '@utils';
import { MouseEvent, ReactElement, KeyboardEvent } from 'react';

interface IMenuDropdownProps {
  id: string;
  type: ListType;
  label: ReactElement | string;
  items: ItemType[];
  onSelect: (e: MouseEvent<HTMLElement>) => void;
}

export const MenuDropdown = (props: IMenuDropdownProps): ReactElement => {
  const { id, type, label, items, onSelect } = props;

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
    if (isBrowser()) {
      document.getElementById(`${id}-item-${item.id}`).focus();
    }
  };

  return type === ListType.DROPDOWN ? (
    <Menu variant="navbar">
      <MenuButton>
        <HStack>
          <>{label}</> <ChevronDownIcon />
        </HStack>
      </MenuButton>
      <MenuList>
        {items.map((item) => (
          <MenuItem key={item.id} onClick={onSelect} data-id={item.id}>
            {item.label}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  ) : (
    <List variant="navbar" role="menu">
      {items.map((item, index) => (
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
      ))}
    </List>
  );
};
