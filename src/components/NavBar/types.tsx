import { ReactNode } from 'react';
import { MenuItemProps } from '@chakra-ui/react';

export enum ListType {
  ACCORDION = 'accordion',
  DROPDOWN = 'dropdown',
}

export type ItemItem = {
  id: string;
  label?: string | ReactNode;
  path?: string;
  disabled?: boolean;
  menuItemProps?: Omit<MenuItemProps, 'onClick'>;
};

export type DividerItem = 'divider';

export type ItemType = ItemItem | DividerItem;
