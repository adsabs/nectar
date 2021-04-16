import { IDocsEntity } from '@nectar/api';

export interface Context {
  user: {
    isLoggedIn: boolean;
  };
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
  SET_LOGGED_IN = 'SET_LOGGED_IN',
  SET_SELECTED_DOCS = 'SET_SELECTED_DOCS',
}

export type SET_DOCS = {
  type: TransitionType.SET_DOCS;
  payload: { docs: Context['result']['docs'] };
};
export type SET_NUM_FOUND = {
  type: TransitionType.SET_NUM_FOUND;
  payload: { numFound: Context['result']['numFound'] };
};
export type SET_LOGGED_IN = {
  type: TransitionType.SET_LOGGED_IN;
  payload: { isLoggedIn: Context['user']['isLoggedIn'] };
};
export type SET_SELECTED_DOCS = {
  type: TransitionType.SET_SELECTED_DOCS;
  payload: { selectedDocs: Context['selectedDocs'] };
};
export type SET_QUERY = {
  type: TransitionType.SET_QUERY;
  payload: { query: Context['query'] };
};

export type Transition =
  | SET_DOCS
  | SET_LOGGED_IN
  | SET_NUM_FOUND
  | SET_SELECTED_DOCS
  | SET_QUERY;

export type Schema = {
  states: {
    idle: Record<string, unknown>;
  };
};
