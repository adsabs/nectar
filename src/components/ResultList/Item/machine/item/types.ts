import { IDocsEntity } from '@api';

export enum TransitionTypes {
  TOGGLE_SELECT = 'ITEM_TOGGLE_SELECT',
}

export interface Schema {
  states: {
    unselected: Record<string, unknown>;
    selected: Record<string, unknown>;
  };
}

export type Transition = { type: TransitionTypes.TOGGLE_SELECT };

export interface Context {
  id: IDocsEntity['id'];
}
