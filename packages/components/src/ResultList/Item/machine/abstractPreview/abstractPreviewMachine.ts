/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import Adsapi from '@nectar/api';
import {
  assign,
  DoneEventObject,
  Machine,
  MachineConfig,
  MachineOptions,
} from 'xstate';
import { Context, Schema, Transition, TransitionTypes } from './types';

export const initialState: Context = {
  id: '',
  meta: {
    abstract: '',
  },
  error: undefined,
};

const config: MachineConfig<Context, Schema, Transition> = {
  key: 'abstractPreview',
  initial: 'idle',
  context: initialState,
  states: {
    idle: {
      on: {
        [TransitionTypes.GET_ABSTRACT]: 'fetching',
      },
    },
    fetching: {
      invoke: {
        id: 'fetchAbstract',
        src: 'fetchAbstract',
        onDone: {
          actions: 'setAbstract',
          target: 'loaded',
        },
        onError: {
          target: 'failure',
          actions: 'setError',
        },
      },
    },
    loaded: {
      type: 'final',
    },
    failure: {
      after: {
        5000: 'idle',
      },
    },
  },
};

const options: Partial<MachineOptions<Context, any>> = {
  services: {
    fetchAbstract: async (ctx) => {
      const { access_token: token } = await Adsapi.bootstrap();
      const adsapi = new Adsapi({ token });
      const { docs } = await adsapi.search.query({
        q: `id:${ctx.id}`,
        fl: ['abstract'],
      });

      return docs[0].abstract;
    },
  },
  actions: {
    setAbstract: assign<Context, DoneEventObject>({
      meta: (ctx, evt) => ({ ...ctx.meta, abstract: evt.data }),
    }),
    setError: assign<Context, DoneEventObject>({
      error: (_ctx, evt) => evt.data as Context['error'],
    }),
  },
};

export const machine = Machine<Context, Schema, Transition>(config, options);
