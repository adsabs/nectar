/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { assign, Machine, MachineConfig, MachineOptions } from 'xstate';
import { Context, Schema, SET_PARAMS, Transition, TransitionType } from './types';

export const initialContext: Context = {
  params: {
    q: '',
    sort: [],
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
  context: initialContext,
  states: {
    initial: {
      always: 'success',
    },
    idle: {
      entry: 'reset',
      on: {
        [TransitionType.SEARCH]: { target: 'fetching', cond: 'validQuery' },
        [TransitionType.SET_PARAMS]: [
          {
            target: 'fetching',
            cond: 'sortHasChanged',
            actions: 'setParams',
          },
          {
            actions: 'setParams',
          },
        ],
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
      on: {
        [TransitionType.SET_PARAMS]: [
          {
            target: 'idle',
            actions: 'setParams',
          },
        ],
      },
    },
    failure: {
      on: {
        [TransitionType.SEARCH]: { target: 'fetching', cond: 'validQuery' },
      },
    },
  },
};

const options: Partial<MachineOptions<Context, any>> = {
  guards: {
    validQuery: (ctx) => typeof ctx.params.q === 'string' && ctx.params.q.length > 0,
    sortHasChanged: (ctx, evt) => Object.keys(evt.payload.params).includes('sort'),
  },
  actions: {
    setParams: assign<Context, SET_PARAMS>({
      params: (ctx, evt) => ({ ...ctx.params, ...evt.payload.params }),
    }),
    setResult: assign({
      result: (ctx, evt) => evt.data,
    }),
    setError: assign({
      error: (_ctx, evt) => evt.data,
    }),
    reset: assign({
      error: () => initialContext.error,
    }),
  },
};

// const sendResultToRoot = (ctx: Context, result: Context['result']) => {
//   const { docs, numFound } = result;
//   const { send } = rootService;

//   // update the root machine with latest result data and current query
//   send([
//     { type: RootTransitionType.SET_DOCS, payload: { docs } } as SET_DOCS,
//     {
//       type: RootTransitionType.SET_NUM_FOUND,
//       payload: { numFound },
//     } as SET_NUM_FOUND,
//     { type: RootTransitionType.SET_QUERY, payload: { query: ctx.params } } as SET_QUERY,
//   ]);
// };

export const searchMachine = Machine<Context, Schema, Transition>(config, options);
