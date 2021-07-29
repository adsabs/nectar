import { IADSApiBootstrapData, IADSApiSearchParams, IDocsEntity } from '@api';

export interface Context {
  session: IADSApiBootstrapData;
  result: {
    docs: (Pick<IDocsEntity, 'id'> & Partial<IDocsEntity>)[];
    numFound: number;
  };
  query: Partial<IADSApiSearchParams>;
  selectedDocs: IDocsEntity['id'][];
}

export enum TransitionType {
  SET_DOCS = 'SET_DOCS',
  SET_QUERY = 'SET_QUERY',
  SET_NUM_FOUND = 'NUM_FOUND',
  SET_SELECTED_DOCS = 'SET_SELECTED_DOCS',
  SET_SESSION_DATA = 'SET_SESSION_DATA',
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
export type SET_SESSION_DATA = {
  type: TransitionType.SET_SESSION_DATA;
  payload: { session: Context['session'] };
};

export type Transition = SET_DOCS | SET_NUM_FOUND | SET_SELECTED_DOCS | SET_QUERY | SET_SESSION_DATA;

export type Schema = {
  states: {
    idle: Record<string, unknown>;
  };
};
