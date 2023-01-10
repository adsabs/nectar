import { ReactElement } from 'react';
import { UrlObject } from 'url';

export interface IMenuItem {
  id: string | number;
  href: string | UrlObject;
  hrefAs: string | UrlObject;
  label: string | ReactElement;
  icon?: ReactElement;
  rightElement?: ReactElement;
  disabled?: boolean;
}

export interface IMenuItemProps extends IMenuItem {
  active?: boolean;
}

export type CatMenuItems = {
  [category: string]: IMenuItem[];
};

export type SingleMenuItems = IMenuItem[];
