import { ReactElement } from 'react';

export enum ListType {
  ACCORDION = 'accordion',
  DROPDOWN = 'dropdown',
}

export type ItemType = {
  id: string;
  label?: string | ReactElement;
  path?: string;
  disabled?: boolean;
};
