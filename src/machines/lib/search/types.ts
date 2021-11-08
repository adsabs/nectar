import { IADSApiSearchParams, IDocsEntity } from '@api';
import { ISearchStatsFields } from '@api/lib/search/types';
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
  SET_PAGINATION = 'SET_PAGINATION',
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
export type SET_PAGINATION = { type: TransitionType.SET_PAGINATION; payload: { pagination: Context['pagination'] } };

export type Transition = SET_PARAMS | SET_RESULT | HIGHLIGHTS | SEARCH | SET_PAGINATION;

export interface Context {
  params: Partial<IADSApiSearchParams>;
  result: {
    docs: (Pick<IDocsEntity, 'id'> & Partial<IDocsEntity>)[];
    numFound: number;
    stats?: ISearchStatsFields;
  };
  error: { message: string; name: string; stack: string };
  pagination: {
    page: number;
    numPerPage: number;
  };
}

export type ISearchMachine = Interpreter<Context, Schema, Transition>;
