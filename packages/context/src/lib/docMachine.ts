/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import Adsapi, { IDocsEntity } from '@nectar/api';
import {
  assign,
  Interpreter,
  Machine,
  MachineConfig,
  MachineOptions,
} from 'xstate';

export interface Schema {
  states: {
    initial: Record<string, unknown>;
    idle: Record<string, unknown>;
    fetchingAbstract: Record<string, unknown>;
    success: Record<string, unknown>;
    failure: Record<string, unknown>;
  };
}

export type Transition = { type: 'GET_ABSTRACT' } | { type: 'TOGGLE_SELECT' };

export interface Context {
  id: IDocsEntity['id'];
  selected: boolean;
  meta: {
    abstract: IDocsEntity['abs'];
  };
  error: { message: string; name: string; stack: string };
}

export type IDocMachine = Interpreter<Context, Schema, Transition>;

export const initialState: Context = {
  id: '',
  selected: false,
  meta: {
    abstract: '',
  },
  error: {
    message: '',
    name: '',
    stack: '',
  },
};

const config: MachineConfig<Context, Schema, Transition> = {
  key: 'doc',
  initial: 'initial',
  context: initialState,
  states: {
    initial: {
      always: 'idle',
    },
    idle: {
      on: {
        GET_ABSTRACT: 'fetchingAbstract',
        TOGGLE_SELECT: {
          actions: 'toggleSelect',
        },
      },
    },
    fetchingAbstract: {
      invoke: {
        id: 'fetchAbstract',
        src: 'fetchAbstract',
        onDone: {
          actions: 'setAbstract',
          target: 'success',
        },
        onError: {
          actions: 'setError',
          target: 'failure',
        },
      },
    },
    success: {},
    failure: {
      after: {
        5000: 'idle',
      },
    },
  },
};

const options: Partial<MachineOptions<Context, any>> = {
  services: {
    fetchAbstract: async ctx => {
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
    setAbstract: assign({
      meta: (ctx, evt) => ({ ...ctx.meta, abstract: evt.data }),
    }),
    setAbstractError: assign({
      error: (_ctx, evt) => evt.data,
    }),
    toggleSelect: assign({
      selected: ctx => !ctx.selected,
    }),
  },
};

export const machine = Machine<Context, Schema, Transition>(config, options);
