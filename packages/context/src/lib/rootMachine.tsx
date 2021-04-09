// import { useMachine } from '@xstate/react';
// import constate from 'constate';
// import { ActorRef, assign, forwardTo, Interpreter, Machine, MachineConfig, MachineOptions, spawn } from 'xstate';
// import { createNullActor } from 'xstate/lib/Actor';
// import { IResultsMachine, machine as resultMachine, Transition as ResultsMachineTransition } from './resultsMachine';
// import { ISearchMachine, machine as searchMachine, Transition as SearchMachineTransition } from './searchMachine';

import { assign, interpret, Machine, MachineConfig, MachineOptions } from "xstate";
import { IDocsEntity } from '../../../api/dist/lib/search/types';
// export interface Schema {
//   states: {
//     initializing: Record<string, unknown>;
//     idle: Record<string, unknown>
//   };
// }

// export type Transition = { type: 'UPDATE' } | { type: 'RESULTS.SET_DOCS' };

// export interface Context {
//   searchMachineRef: ActorRef<SearchMachineTransition, ISearchMachine['state']>;
//   resultsMachineRef: ActorRef<ResultsMachineTransition, IResultsMachine['state']>;
// }

// export type IRootMachine = Interpreter<Context, Schema, Transition>;

// const config: MachineConfig<Context, Schema, Transition> = {
//   key: 'root',
//   initial: 'initializing',
//   context: {
//     searchMachineRef: spawn(createNullActor('search')),
//     resultsMachineRef: spawn(createNullActor('results'))
//   },
//   states: {
//     initializing: {
//       always: {
//         target: 'idle',
//         actions: 'spawnChildMachines'
//       }
//     },
//     idle: {
//       on: {
//         'RESULTS.SET_DOCS': {
//           actions: forwardTo('results')
//         }
//       }
//     }
//   },
// };

// const options: Partial<MachineOptions<Context, Transition>> = {
//   actions: {
//     spawnChildMachines: assign<Context, Transition>({
//       searchMachineRef: () => spawn(searchMachine, { sync: true, name: 'search' }),
//       resultsMachineRef: () => spawn(resultMachine, { sync: true, name: 'results' })
//     }),
//   },
// };

// const rootMachine = Machine<Context, Schema, Transition>(config, options);

// const useRootMachine = () => useMachine(rootMachine, { devTools: true });

// const [Provider, useContext] = constate(useRootMachine);

// export const RootMachineProvider = Provider;
// export const useRootMachineContext: typeof useRootMachine = useContext;



export interface IRootMachineContext {
  user: {
    isLoggedIn: boolean;
  },
  result: {
    docs: (Pick<IDocsEntity, 'id'> & Partial<IDocsEntity>)[];
    numFound: number;
  },
  selectedDocs: IDocsEntity['id'][]
}

export enum RootTransitionType {
  SET_DOCS = 'ROOT_SET_DOCS',
  SET_NUM_FOUND = 'ROOT_NUM_FOUND',
  SET_LOGGED_IN = 'ROOT_SET_LOGGED_IN',
  SET_SELECTED_DOCS = 'ROOT_SET_SELECTED_DOCS'
}

type SET_DOCS = { type: RootTransitionType.SET_DOCS, payload: { docs: IRootMachineContext['result']['docs'] } };
type SET_NUM_FOUND = { type: RootTransitionType.SET_NUM_FOUND, payload: { numFound: IRootMachineContext['result']['numFound'] } }
type SET_LOGGED_IN = { type: RootTransitionType.SET_LOGGED_IN, payload: { isLoggedIn: IRootMachineContext['user']['isLoggedIn'] } }
type SET_SELECTED_DOCS = { type: RootTransitionType, payload: { selectedDocs: IRootMachineContext['selectedDocs'] } }

type RootTransition =
  | SET_DOCS
  | SET_LOGGED_IN
  | SET_NUM_FOUND
  | SET_SELECTED_DOCS;

export const initialRootState: IRootMachineContext = {
  user: {
    isLoggedIn: false
  },
  result: {
    docs: [],
    numFound: 0
  },
  selectedDocs: []
}

export type RootSchema = {
  states: {
    idle: Record<string, unknown>
  }
}

const config: MachineConfig<IRootMachineContext, RootSchema, RootTransition> = {
  id: 'root',
  initial: 'idle',
  context: initialRootState,
  states: {
    idle: {
      on: {
        [RootTransitionType.SET_DOCS]: { actions: 'setDocs' },
        [RootTransitionType.SET_NUM_FOUND]: { actions: 'setNumFound' },
        [RootTransitionType.SET_SELECTED_DOCS]: { actions: 'setSelectedDocs' },
        [RootTransitionType.SET_LOGGED_IN]: { actions: 'setLoggedIn' },
      }
    }
  }
}

const options: Partial<MachineOptions<IRootMachineContext, any>> = {
  actions: {
    setDocs: assign<IRootMachineContext, SET_DOCS>({
      result: (ctx, evt) => ({ ...ctx.result, docs: evt.payload.docs })
    }),
    setNumFound: assign<IRootMachineContext, SET_NUM_FOUND>({
      result: (ctx, evt) => ({ ...ctx.result, numFound: evt.payload.numFound })
    }),
    setSelectedDocs: assign<IRootMachineContext, SET_SELECTED_DOCS>({
      selectedDocs: (ctx, evt) => evt.payload.selectedDocs
    }),
  }
}


const rootMachine = Machine<IRootMachineContext, RootSchema, RootTransition>(config, options);

export const rootService = interpret(rootMachine);

// start the interpreted machine
rootService.start();
