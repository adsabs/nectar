import { IDocsEntity } from '@nectar/api';

export enum TransitionTypes {
  GET_ABSTRACT = 'ITEM_GET_ABSTRACT',
}

export interface Schema {
  states: {
    idle: Record<string, unknown>;
    fetching: Record<string, unknown>;
    loaded: Record<string, unknown>;
    failure: Record<string, unknown>;
  };
}

export type GET_ABSTRACT = { type: TransitionTypes.GET_ABSTRACT };

export type Transition = GET_ABSTRACT;

export interface Context {
  id: IDocsEntity['id'];
  meta: {
    abstract: IDocsEntity['abstract'];
  };
  error?: {
    message: string;
  };
}
