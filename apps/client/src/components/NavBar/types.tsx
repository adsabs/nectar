import { ReactElement } from 'react';
import { ListItemProps, MenuItemProps } from '@chakra-ui/react';

export enum ListType {
  ACCORDION = 'accordion',
  DROPDOWN = 'dropdown',
}

export type ItemItem = {
  id: string;
  label?: string | ReactElement;
  path?: string;
  disabled?: boolean;
  menuItemProps?: Omit<MenuItemProps, 'onClick'>;
  listItemProps?: ListItemProps;
  static?: boolean;
};

export type DividerItem = 'divider';

export type ItemType = ItemItem | DividerItem;
