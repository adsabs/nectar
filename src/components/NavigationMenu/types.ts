import { ReactElement, ReactNode } from 'react';
import { UrlObject } from 'url';

export interface IMenuItem {
  id: string | number;
  href: string | UrlObject;
  hrefAs: string | UrlObject;
  label: string | ReactNode;
  icon?: ReactElement;
  rightElement?: ReactNode;
  disabled?: boolean;
}

export interface IMenuItemProps extends IMenuItem {
  active?: boolean;
}

export type CatMenuItems = {
  [category: string]: IMenuItem[];
};

export type SingleMenuItems = IMenuItem[];
