import { IADSApiSearchParams, IDocsEntity } from '@api';
import { Interpreter } from 'xstate';

export interface Schema {
  states: {
    initial: Record<string, unknown>;
    idle: Record<string, unknown>;
    fetching: Record<string, unknown>;
    success: Record<string, unknown>;
    failure: Record<string, unknown>;
  };
}

export enum TransitionType {
  SET_PARAMS = 'SET_PARAMS',
  SET_RESULT = 'SET_RESULT',
  HIGHLIGHTS = 'HIGHLIGHTS',
  SEARCH = 'SEARCH',
}

export type SET_PARAMS = {
  type: TransitionType.SET_PARAMS;
  payload: { params: Context['params'] };
};
export type SET_RESULT = {
  type: TransitionType.SET_RESULT;
  payload: { result: Context['result'] };
};
export type HIGHLIGHTS = { type: TransitionType.HIGHLIGHTS };
export type SEARCH = { type: TransitionType.SEARCH };

export type Transition = SET_PARAMS | SET_RESULT | HIGHLIGHTS | SEARCH;

export interface Context {
  params: Partial<IADSApiSearchParams>;
  result: {
    docs: (Pick<IDocsEntity, 'id'> & Partial<IDocsEntity>)[];
    numFound: number;
  };
  error: { message: string; name: string; stack: string };
}

export type ISearchMachine = Interpreter<Context, Schema, Transition>;
