/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import api, { IADSApiSearchParams, IDocsEntity } from '@nectar/api';
import { mergeRight } from 'ramda';
import {
  assign,
  Interpreter,
  Machine,
  MachineConfig,
  MachineOptions,
} from 'xstate';

export interface Schema {
  states: {
    idle: Record<string, unknown>;
    fetching: Record<string, unknown>;
    success: Record<string, unknown>;
    failure: Record<string, unknown>;
  };
}

export type Transition =
  | { type: 'FETCH' }
  | { type: 'SET_PARAMS'; payload: { params: IADSApiSearchParams } };

export interface Context {
  params: IADSApiSearchParams;
  result: {
    docs: Partial<IDocsEntity>[];
    numFound: number;
  };
  error: unknown;
}

export type IResultMachine = Interpreter<Context, Schema, Transition>;

const config: MachineConfig<Context, Schema, Transition> = {
  key: 'result',
  initial: 'idle',
  context: {
    params: {
      q: '',
    },
    result: {
      docs: [],
      numFound: 0,
    },
    error: undefined,
  },
  states: {
    idle: {
      on: {
        FETCH: 'fetching',
        SET_PARAMS: {
          actions: 'setParams',
        },
      },
    },
    fetching: {
      invoke: {
        id: 'fetchResults',
        src: 'fetchResult',
        onDone: {
          actions: 'setResult',
          target: 'success',
        },
        onError: {
          actions: 'setError',
          target: 'failure',
        },
      },
    },
    success: {},
    failure: {},
  },
};

const options: Partial<MachineOptions<Context, any>> = {
  services: {
    fetchResult: async ctx => {
      console.log(ctx);
      const { docs, numFound } = await api.search.query({
        q: 'star',
        fl: ['bibcode', 'author', 'title', 'pubdate'],
      });

      return {
        docs,
        numFound,
      };
    },
  },
  actions: {
    setParams: assign({
      params: (ctx, evt) => mergeRight(ctx.params, evt.payload.params),
    }),
    setResult: assign({
      result: (_ctx, evt) => evt.data,
    }),
    setError: assign({
      error: (_ctx, evt) => evt.data,
    }),
  },
};

export const machine = Machine<Context, Schema, Transition>(config, options);
