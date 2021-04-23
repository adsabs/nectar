import { IADSApiSearchParams, IDocsEntity } from '@nectar/api';
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

export type Transition =
  | { type: TransitionType.SET_PARAMS; payload: { params: Context['params'] } }
  | { type: TransitionType.SET_RESULT; payload: { result: Context['result'] } }
  | { type: TransitionType.HIGHLIGHTS }
  | { type: TransitionType.SEARCH };

export interface Context {
  params: Partial<IADSApiSearchParams>;
  result: {
    docs: (Pick<IDocsEntity, 'id'> & Partial<IDocsEntity>)[];
    numFound: number;
  };
  error: { message: string; name: string; stack: string };
}

export type ISearchMachine = Interpreter<Context, Schema, Transition>;
