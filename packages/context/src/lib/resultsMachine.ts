/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { IDocsEntity } from '@nectar/api';
import {
  ActorRef,
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
  Transition as ItemTransition,
} from './docMachine';

export interface Schema {
  states: {
    initial: Record<string, unknown>;
    idle: Record<string, unknown>;
  };
}

export type Transition = {
  type: 'RESULTS.SET_DOCS';
  payload: { docs: IDocsEntity['id'][] };
};

export interface Context {
  docRefs: Record<string, ActorRef<ItemTransition, IDocMachine['state']>>;
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
    setDocs: assign<Context, Transition>({
      docRefs: (_ctx, evt) => {
        console.log('spawning docs', evt.payload);
        const refs = evt.payload.docs.reduce(
          (acc, id) => ({
            ...acc,
            [id]: spawn(
              docMachine.withContext({ ...initialDocMachineState, id }),
              `doc-${id}`
            ),
          }),
          {}
        );
        console.log({ refs });
        return refs;
      },
    }),
  },
};

export const machine = Machine<Context, Schema, Transition>(config, options);
