/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import Adsapi from '@nectar/api';
import { assign, Machine, MachineConfig, MachineOptions } from 'xstate';
import { rootService, RootTransitionType } from '../root';
import { Context, Schema, Transition, TransitionType } from './types';

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
          // {
          //   target: 'fetching',
          //   cond: 'sortHasChanged',
          //   actions: 'setParams',
          // },
          {
            target: 'idle',
            actions: 'setParams',
          },
        ],
      },
    },
    failure: {
      on: {
        [TransitionType.SET_PARAMS]: [
          // {
          //   target: 'fetching',
          //   cond: 'sortHasChanged',
          //   actions: 'setParams',
          // },
          {
            target: 'idle',
            actions: 'setParams',
          },
        ],
      },
    },
  },
};

const options: Partial<MachineOptions<Context, any>> = {
  guards: {
    validQuery: ctx =>
      typeof ctx.params.q === 'string' && ctx.params.q.length > 0,
    sortHasChanged: (ctx, evt) =>
      Object.keys(evt.payload.params).includes('sort') &&
      typeof ctx.params.q === 'string' &&
      ctx.params.q.length > 0,
  },
  services: {
    fetchResult: async ctx => {
      if (ctx.params.q === '' || typeof ctx.params.q === 'undefined') {
        throw new Error('no query');
      }

      let {
        user: { access_token: token },
      } = rootService.state.context;
      if (typeof token !== 'string' || token.length === 0) {
        const result = await Adsapi.bootstrap();
        result.map(({ access_token }) => (token = access_token));
      }

      const adsapi = new Adsapi({ token });

      const result = await adsapi.search.query({
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

      if (result.isErr()) {
        throw result.error;
      }

      const { docs, numFound } = result.value;
      return { ...ctx, result: { docs, numFound } };
    },
  },
  actions: {
    setParams: assign({
      params: (ctx, evt) => ({ ...ctx.params, ...evt.payload.params }),
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
      error: (_ctx, _evt) => initialContext.error,
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
