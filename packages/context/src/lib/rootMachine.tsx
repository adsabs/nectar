import { useMachine } from '@xstate/react';
import constate from 'constate';
import { ActorRef, assign, forwardTo, Interpreter, Machine, MachineConfig, MachineOptions, spawn } from 'xstate';
import { createNullActor } from 'xstate/lib/Actor';
import { IResultsMachine, machine as resultMachine, Transition as ResultsMachineTransition } from './resultsMachine';
import { ISearchMachine, machine as searchMachine, Transition as SearchMachineTransition } from './searchMachine';

export interface Schema {
  states: {
    initializing: Record<string, unknown>;
    idle: Record<string, unknown>
  };
}

export type Transition = { type: 'UPDATE' } | { type: 'RESULTS.SET_DOCS' };

export interface Context {
  searchMachineRef: ActorRef<SearchMachineTransition, ISearchMachine['state']>;
  resultsMachineRef: ActorRef<ResultsMachineTransition, IResultsMachine['state']>;
}

export type IRootMachine = Interpreter<Context, Schema, Transition>;

const config: MachineConfig<Context, Schema, Transition> = {
  key: 'root',
  initial: 'initializing',
  context: {
    searchMachineRef: spawn(createNullActor('search')),
    resultsMachineRef: spawn(createNullActor('results'))
  },
  states: {
    initializing: {
      always: {
        target: 'idle',
        actions: 'spawnChildMachines'
      }
    },
    idle: {
      on: {
        'RESULTS.SET_DOCS': {
          actions: forwardTo('results')
        }
      }
    }
  },
};

const options: Partial<MachineOptions<Context, Transition>> = {
  actions: {
    spawnChildMachines: assign<Context, Transition>({
      searchMachineRef: () => spawn(searchMachine, { sync: true, name: 'search' }),
      resultsMachineRef: () => spawn(resultMachine, { sync: true, name: 'results' })
    }),
  },
};

const rootMachine = Machine<Context, Schema, Transition>(config, options);

const useRootMachine = () => useMachine(rootMachine, { devTools: true });

const [Provider, useContext] = constate(useRootMachine);

export const RootMachineProvider = Provider;
export const useRootMachineContext: typeof useRootMachine = useContext;
