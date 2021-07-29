import { assign, interpret, Machine, MachineConfig, MachineOptions } from 'xstate';
import {
  Context,
  Schema,
  SET_DOCS,
  SET_NUM_FOUND,
  SET_QUERY,
  SET_SELECTED_DOCS,
  SET_SESSION_DATA,
  Transition,
  TransitionType,
} from './types';

export const initialContext: Context = {
  session: {
    username: 'anonymous',
    anonymous: true,
    access_token: '',
    expire_in: '',
  },
  query: {
    q: '',
    sort: [],
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
        [TransitionType.SET_SESSION_DATA]: { actions: 'setSessionData' },
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
    setSessionData: assign<Context, SET_SESSION_DATA>({
      session: (ctx, evt) => evt.payload.session,
    }),
  },
};

const STORAGE_KEY = 'nectar-app-state';
const machine = Machine<Context, Schema, Transition>(config, options);
const persistedState =
  typeof window === 'undefined'
    ? initialContext
    : (JSON.parse(window.localStorage.getItem(STORAGE_KEY)) as Context) || initialContext;

export const service = interpret(machine.withContext(persistedState), { devTools: true });

service.onChange((context, prev) => {
  console.log('[context change]', { prev, context });
  if (typeof window !== 'undefined') {
    window.requestAnimationFrame(() => {
      const { result, ...subContext } = context;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(subContext));
    });
  }
});

// start the interpreted machine
service.start();
