/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import Adsapi from '@nectar/api';
import { assign, Machine, MachineConfig, MachineOptions } from 'xstate';
import { rootService, RootTransitionType } from '../root';
import { Context, Schema, Transition, TransitionType } from './types';

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
        [TransitionType.SEARCH]: 'fetching',
        [TransitionType.SET_PARAMS]: {
          actions: 'setParams',
        },
        [TransitionType.SET_RESULT]: {
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
      on: { [TransitionType.SET_PARAMS]: 'idle' },
    },
    failure: {
      on: { [TransitionType.SET_PARAMS]: 'idle' },
    },
  },
};

const options: Partial<MachineOptions<Context, any>> = {
  services: {
    fetchResult: async ctx => {
      if (ctx.params.q === '' || typeof ctx.params.q === 'undefined') {
        throw new Error('no query');
      }

      let {
        user: { access_token: token },
      } = rootService.state.context;
      if (typeof token !== 'string' || token.length === 0) {
        const { access_token } = await Adsapi.bootstrap();
        token = access_token;
      }

      const adsapi = new Adsapi({ token });
      const { docs, numFound } = await adsapi.search.query({
        q: ctx.params.q,
        fl: [
          'bibcode',
          'title',
          'author',
          '[fields author=3]',
          'author_count',
          'pubdate',
        ],
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
      result: (_ctx, evt) => {
        sendResultToRoot(evt.payload.result);
        return evt.payload.result;
      },
    }),
    setResult: assign({
      result: (_ctx, evt) => {
        sendResultToRoot(evt.data);
        return evt.data;
      },
    }),
    setError: assign({
      error: (_ctx, evt) => evt.data,
    }),
    reset: assign({
      error: (_ctx, _evt) => initialState.error,
    }),
  },
};

const sendResultToRoot = (result: Context['result']) => {
  const { docs, numFound } = result;
  const { send } = rootService;

  // update the root machine with latest result data
  send([
    { type: RootTransitionType.SET_DOCS, payload: { docs } },
    {
      type: RootTransitionType.SET_NUM_FOUND,
      payload: { numFound },
    },
  ]);
};

export const searchMachine = Machine<Context, Schema, Transition>(
  config,
  options
);
