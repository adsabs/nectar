import { useMachine } from '@xstate/react';
import constate from 'constate';
import { Interpreter, Machine, MachineConfig, MachineOptions } from 'xstate';

export interface Schema {
  states: {
    idle: Record<string, unknown>;
  };
}

export type Transition = { type: 'UPDATE' };

export interface Context {
  docs: string[];
}

export type IRootMachine = Interpreter<Context, Schema, Transition>;

const config: MachineConfig<Context, Schema, Transition> = {
  key: 'root',
  initial: 'idle',
  context: { docs: [] },
  states: {
    idle: {
      entry: 'spawn',
    },
  },
};

const options: Partial<MachineOptions<Context, Transition>> = {
  actions: {
    // spawn: assign<Context, Transition>({
    //   resultRef: () => spawn(resultMachine, 'result'),
    // }),
  },
};

const rootMachine = Machine<Context, Schema, Transition>(config, options);

const useRootMachine = () => {
  return useMachine(rootMachine);
};

export const [Provider, useContext] = constate(useRootMachine);
