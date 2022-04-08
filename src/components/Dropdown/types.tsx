import { LinkProps } from 'next/link';
import { ReactElement } from 'react';

export enum ListType {
  DROPDOWN = 'dropdown',
  MENU = 'menu',
}

export type ItemType = {
  id: string;
  label?: string | ReactElement;
  linkProps: LinkProps;
  newTab?: boolean;
  disabled?: boolean;
};
