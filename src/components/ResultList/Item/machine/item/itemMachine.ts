/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { rootService, RootTransitionType } from '@machines';
import { SET_SELECTED_DOCS } from '@machines/lib/root/types';
import { assign, Interpreter, Machine, MachineConfig, MachineOptions } from 'xstate';
import { Context, Schema, Transition, TransitionTypes } from './types';

export type IDocMachine = Interpreter<Context, Schema, Transition>;

export const initialContext: Context = {
  id: '',
};

const config: MachineConfig<Context, Schema, Transition> = {
  key: 'item',
  initial: 'unselected',
  context: initialContext,
  states: {
    unselected: {
      on: {
        [TransitionTypes.TOGGLE_SELECT]: {
          target: 'selected',
        },
      },
    },
    selected: {
      entry: 'addToRootContext',
      exit: 'removeFromRootContext',
      on: {
        [TransitionTypes.TOGGLE_SELECT]: {
          target: 'unselected',
        },
      },
    },
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const options: Partial<MachineOptions<Context, any>> = {
  actions: {
    addToRootContext: assign((ctx) => {
      const { state, send } = rootService;
      const selectedDocs = [...state.context.selectedDocs, ctx.id];
      send({
        type: RootTransitionType.SET_SELECTED_DOCS,
        payload: { selectedDocs },
      } as SET_SELECTED_DOCS);

      return ctx;
    }),
    removeFromRootContext: assign((ctx) => {
      const { state, send } = rootService;
      const selectedDocs = state.context.selectedDocs.filter((id) => id !== ctx.id);
      send({
        type: RootTransitionType.SET_SELECTED_DOCS,
        payload: { selectedDocs },
      } as SET_SELECTED_DOCS);

      return ctx;
    }),
  },
};

export const machine = Machine<Context, Schema, Transition>(config, options);
