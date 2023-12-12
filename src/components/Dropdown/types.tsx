import { ReactNode } from 'react';
import { UrlObject } from 'url';

export enum ListType {
  DROPDOWN = 'dropdown',
  MENU = 'menu',
}

export type ItemType = {
  id: string;
  label?: string | ReactNode;
  path?: string | UrlObject;
  newTab?: boolean;
  disabled?: boolean;
};
