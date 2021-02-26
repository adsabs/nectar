import { useMachine } from '@xstate/react';
import constate from 'constate';
import { assign, Machine } from 'xstate';

interface RootStateSchema {
  states: {
    idle: {};
  };
}

// The events that the machine handles
type RootEvent = { type: 'INC' } | { type: 'DEC' };

// The context (extended state) of the machine
interface RootContext {
  count: number;
}

const rootMachine = Machine<RootContext, RootStateSchema, RootEvent>(
  {
    id: 'root',
    initial: 'idle',
    context: {
      count: 0,
    },
    states: {
      idle: {
        on: {
          INC: {
            target: 'idle',
            actions: 'increment',
          },
          DEC: {
            target: 'idle',
            actions: 'decrement',
          },
        },
      },
    },
  },
  {
    actions: {
      increment: assign({
        count: ctx => ctx.count + 1,
      }),
      decrement: assign({
        count: ctx => ctx.count - 1,
      }),
    },
  },
);

const useRootMachine = () => {
  return useMachine(rootMachine);
};

export const [RootMachineProvider, useRootMachineContext] = constate(
  useRootMachine,
);
