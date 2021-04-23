import { IADSApiBootstrapData, IDocsEntity } from '@nectar/api';

export interface Context {
  user: IADSApiBootstrapData;
  result: {
    docs: (Pick<IDocsEntity, 'id'> & Partial<IDocsEntity>)[];
    numFound: number;
  };
  query: {
    q: string;
  };
  selectedDocs: IDocsEntity['id'][];
}

export enum TransitionType {
  SET_DOCS = 'SET_DOCS',
  SET_QUERY = 'SET_QUERY',
  SET_NUM_FOUND = 'NUM_FOUND',
  SET_SELECTED_DOCS = 'SET_SELECTED_DOCS',
  SET_USER_DATA = 'SET_USER_DATA',
}

export type SET_DOCS = {
  type: TransitionType.SET_DOCS;
  payload: { docs: Context['result']['docs'] };
};
export type SET_NUM_FOUND = {
  type: TransitionType.SET_NUM_FOUND;
  payload: { numFound: Context['result']['numFound'] };
};
export type SET_SELECTED_DOCS = {
  type: TransitionType.SET_SELECTED_DOCS;
  payload: { selectedDocs: Context['selectedDocs'] };
};
export type SET_QUERY = {
  type: TransitionType.SET_QUERY;
  payload: { query: Context['query'] };
};
export type SET_USER_DATA = {
  type: TransitionType.SET_USER_DATA;
  payload: { user: Context['user'] };
};

export type Transition =
  | SET_DOCS
  | SET_NUM_FOUND
  | SET_SELECTED_DOCS
  | SET_QUERY
  | SET_USER_DATA;

export type Schema = {
  states: {
    idle: Record<string, unknown>;
  };
};
