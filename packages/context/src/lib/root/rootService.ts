import {
  assign,
  interpret,
  Machine,
  MachineConfig,
  MachineOptions,
} from 'xstate';
import {
  Context,
  Schema,
  SET_DOCS,
  SET_NUM_FOUND,
  SET_QUERY,
  SET_SELECTED_DOCS,
  Transition,
  TransitionType,
} from './types';

export const initialContext: Context = {
  user: {
    isLoggedIn: false,
  },
  query: {
    q: '',
  },
  result: {
    docs: [],
    numFound: 0,
  },
  selectedDocs: [],
};

const config: MachineConfig<Context, Schema, Transition> = {
  id: 'root',
  initial: 'idle',
  context: initialContext,
  states: {
    idle: {
      on: {
        [TransitionType.SET_DOCS]: { actions: 'setDocs' },
        [TransitionType.SET_NUM_FOUND]: { actions: 'setNumFound' },
        [TransitionType.SET_SELECTED_DOCS]: { actions: 'setSelectedDocs' },
        [TransitionType.SET_LOGGED_IN]: { actions: 'setLoggedIn' },
        [TransitionType.SET_QUERY]: { actions: 'setQuery' },
      },
    },
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const options: Partial<MachineOptions<Context, any>> = {
  actions: {
    setDocs: assign<Context, SET_DOCS>({
      result: (ctx, evt) => ({ ...ctx.result, docs: evt.payload.docs }),
    }),
    setNumFound: assign<Context, SET_NUM_FOUND>({
      result: (ctx, evt) => ({ ...ctx.result, numFound: evt.payload.numFound }),
    }),
    setSelectedDocs: assign<Context, SET_SELECTED_DOCS>({
      selectedDocs: (ctx, evt) => evt.payload.selectedDocs,
    }),
    setQuery: assign<Context, SET_QUERY>({
      query: (ctx, evt) => evt.payload.query,
    }),
  },
};

const machine = Machine<Context, Schema, Transition>(config, options);

export const service = interpret(machine);

// start the interpreted machine
service.start();
