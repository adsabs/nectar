/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { IDocsEntity } from '@nectar/api';
import {
  Actor,
  assign,
  Interpreter,
  Machine,
  MachineConfig,
  MachineOptions,
  spawn,
} from 'xstate';
import {
  IDocMachine,
  initialState as initialDocMachineState,
  machine as docMachine,
  Transition as IDocTransition,
} from './docMachine';

export interface Schema {
  states: {
    initial: Record<string, unknown>;
    idle: Record<string, unknown>;
  };
}

type SetDocs = {
  type: 'RESULTS.SET_DOCS';
  payload: { docs: IDocsEntity['id'][] };
};

export type Transition = SetDocs;

export interface Context {
  docRefs: Record<string, Actor<IDocMachine['state'], IDocTransition>>;
}

export type IResultsMachine = Interpreter<Context, Schema, Transition>;

const initialState: Context = {
  docRefs: {},
};

const config: MachineConfig<Context, Schema, Transition> = {
  key: 'results',
  initial: 'initial',
  context: initialState,
  states: {
    initial: {
      always: 'idle',
    },
    idle: {
      on: {
        'RESULTS.SET_DOCS': {
          actions: 'setDocs',
        },
      },
    },
  },
};

const options: Partial<MachineOptions<Context, any>> = {
  actions: {
    setDocs: assign<Context, SetDocs>((ctx, evt) => {
      console.log('spawning docs', evt.payload);

      // stop all running children
      Object.values(ctx.docRefs).forEach(d => {
        if (typeof d.stop === 'function') {
          d.stop();
        }
      });

      // spawn new actors (children) from payload
      const docRefs = evt.payload.docs.reduce(
        (acc, id) => ({
          ...acc,
          [id]: spawn(
            docMachine.withContext({ ...initialDocMachineState, id }),
            { name: `doc-${id}`, sync: true }
          ),
        }),
        {}
      );
      return { docRefs };
    }),
  },
};

export const machine = Machine<Context, Schema, Transition>(config, options);
