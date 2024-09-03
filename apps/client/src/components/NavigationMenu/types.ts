import { ReactElement } from 'react';

import { ISimpleLinkProps } from '@/components';

export interface IMenuItem extends Pick<ISimpleLinkProps, 'href'> {
  id: string | number;
  label: string | ReactElement;
  icon?: ReactElement;
  rightElement?: ReactElement | null;
  disabled?: boolean;
}

export interface IMenuItemProps extends IMenuItem {
  active?: boolean;
}

export type CatMenuItems = {
  [category: string]: IMenuItem[];
};

export type SingleMenuItems = IMenuItem[];
