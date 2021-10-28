import { ReactElement } from 'react';

export enum ListType {
  DROPDOWN = 'dropdown',
  MENU = 'menu',
}

export type ItemType = {
  id: string;
  label?: string | ReactElement;
  path?: string;
  newTab?: boolean;
  domId: string;
  disabled?: boolean;
  classes?: string;
};
