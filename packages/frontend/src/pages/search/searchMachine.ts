/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import Adsapi from '@nectar/api';
import { assign, Machine, MachineConfig, MachineOptions } from 'xstate';
import { Context, Schema, Transition } from './types';

const initialState: Context = {
  params: {
    q: '',
    sort: [['date', 'desc']],
  },
  result: {
    docs: [],
    numFound: 0,
  },
  error: {
    message: '',
    name: '',
    stack: '',
  },
};

const config: MachineConfig<Context, Schema, Transition> = {
  key: 'search',
  initial: 'initial',
  context: initialState,
  states: {
    initial: {
      always: 'idle',
    },
    idle: {
      entry: 'reset',
      on: {
        SEARCH: 'fetching',
        SET_PARAMS: {
          actions: 'setParams',
        },
        SET_RESULT: {
          actions: 'setInitialResults',
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
    success: {
      on: { SET_PARAMS: 'idle' },
    },
    failure: {
      on: { SET_PARAMS: 'idle' },
    },
  },
};

const options: Partial<MachineOptions<Context, any>> = {
  services: {
    fetchResult: async (ctx) => {
      if (ctx.params.q === '' || typeof ctx.params.q === 'undefined') {
        throw new Error('no query');
      }
      const { access_token: token } = await Adsapi.bootstrap();
      const adsapi = new Adsapi({ token });
      const { docs, numFound } = await adsapi.search.query({
        q: ctx.params.q,
        fl: ['bibcode', 'author', 'title', 'pubdate'],
        sort: ctx.params.sort,
      });

      return {
        docs,
        numFound,
      };
    },
  },
  actions: {
    setParams: assign({
      params: (ctx, evt) => ({ ...ctx.params, ...evt.payload.params }),
    }),
    setInitialResults: assign({
      result: (_ctx, evt) => evt.payload.result,
    }),
    setResult: assign({
      result: (_ctx, evt) => evt.data,
    }),
    setError: assign({
      error: (_ctx, evt) => evt.data,
    }),
    reset: assign({
      error: (_ctx, _evt) => initialState.error,
    }),
  },
};

export const searchMachine = Machine<Context, Schema, Transition>(
  config,
  options,
);
