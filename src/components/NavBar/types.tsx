import { ReactElement } from 'react';
import { MenuItemProps } from '@chakra-ui/react';

export enum ListType {
  ACCORDION = 'accordion',
  DROPDOWN = 'dropdown',
}

export type ItemType = {
  id: string;
  label?: string | ReactElement;
  path?: string;
  disabled?: boolean;
  menuItemProps?: Omit<MenuItemProps, 'onClick'>;
};
