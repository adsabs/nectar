import { Interpreter, Machine, MachineConfig, MachineOptions } from 'xstate';
import { TypeaheadOption, typeaheadOptions } from '../types';

interface Schema {
  states: {
    closed: Record<string, unknown>;
    opened: Record<string, unknown>;
  };
}

export enum TransitionTypes {
  CLOSE = 'CLOSE',
  OPEN = 'OPEN',
}

export type CLOSE = { type: TransitionTypes.CLOSE };
export type OPEN = { type: TransitionTypes.OPEN };

export type Transition = OPEN | CLOSE;

interface Context {
  items: TypeaheadOption[];
  inputValue: string;
}

const initialContext: Context = {
  items: typeaheadOptions,
  inputValue: '',
};

const config: MachineConfig<Context, Schema, Transition> = {
  key: 'autosuggest',
  initial: 'closed',
  context: initialContext,
  states: {
    closed: {
      on: {
        OPEN: 'opened',
      },
    },
    opened: {
      on: {
        CLOSE: 'closed',
      },
    },
  },
};

const options: Partial<MachineOptions<Context, Transition>> = {
  actions: {
    reset: () => initialContext,
  },
};

export type ITypeaheadMachine = Interpreter<Context, Schema, Transition>;
export const typeaheadMachine = Machine<Context, Schema, Transition>(
  config,
  options,
);
