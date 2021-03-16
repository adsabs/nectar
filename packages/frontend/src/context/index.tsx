import { useMachine } from '@xstate/react';
import constate from 'constate';
import { assign, Machine } from 'xstate';

interface RootStateSchema {
  states: {
    idle: Record<string, unknown>;
    hasResults: Record<string, unknown>;
  };
}

// The events that the machine handles
type RootEvent = { type: 'RESULTS'; payload: RootContext['results'] };

// The context (extended state) of the machine
interface RootContext {
  results: {
    numFound: number;
    docs: unknown[];
  };
}

const rootMachine = Machine<RootContext, RootStateSchema, RootEvent>(
  {
    id: 'root',
    initial: 'idle',
    context: {
      results: {
        numFound: 0,
        docs: [],
      },
    },
    states: {
      idle: {
        on: {
          RESULTS: {
            target: 'hasResults',
            actions: 'updateResults',
          },
        },
      },
      hasResults: {},
    },
  },
  {
    actions: {
      updateResults: assign<RootContext, RootEvent>({
        results: (_ctx, event) => event.payload,
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
