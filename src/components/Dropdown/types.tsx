export enum ListType {
  DROPDOWN = 'dropdown',
  MENU = 'menu'
}

export type ItemType = {
  id: string;
  label?: string;
  path?: string;
  domId: string;
};