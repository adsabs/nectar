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
    abstract: {
      states: {
        idle: Record<string, unknown>;
        fetching: Record<string, unknown>;
        loaded: Record<string, unknown>;
        failure: Record<string, unknown>;
      };
    };
    select: {
      states: {
        unselected: Record<string, unknown>;
        selected: Record<string, unknown>;
      };
    };
  };
}

export type Transition = { type: 'GET_ABSTRACT' } | { type: 'TOGGLE_SELECT' };

export interface Context {
  id: IDocsEntity['id'];
  meta: {
    abstract: IDocsEntity['abstract'];
  };
  error?: {
    message: string;
  };
}

export type IDocMachine = Interpreter<Context, Schema, Transition>;

export const initialState: Context = {
  id: '',
  meta: {
    abstract: '',
  },
  error: undefined,
};

const config: MachineConfig<Context, Schema, Transition> = {
  key: 'doc',
  type: 'parallel',
  context: initialState,
  states: {
    abstract: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            GET_ABSTRACT: 'fetching',
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
    },
    select: {
      initial: 'unselected',
      states: {
        unselected: {
          on: {
            TOGGLE_SELECT: 'selected',
          },
        },
        selected: {
          on: {
            TOGGLE_SELECT: 'unselected',
          },
        },
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
    setError: assign({
      error: (_ctx, evt) => evt.data,
    }),
  },
};

export const machine = Machine<Context, Schema, Transition>(config, options);
