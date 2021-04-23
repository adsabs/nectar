import { IADSApiBootstrapData, IDocsEntity } from '@nectar/api';
import {
  assign,
  interpret,
  Machine,
  MachineConfig,
  MachineOptions,
} from 'xstate';

export interface IRootMachineContext {
  user: IADSApiBootstrapData;
  result: {
    docs: (Pick<IDocsEntity, 'id'> & Partial<IDocsEntity>)[];
    numFound: number;
  };
  selectedDocs: IDocsEntity['id'][];
}

export enum RootTransitionType {
  SET_DOCS = 'ROOT_SET_DOCS',
  SET_NUM_FOUND = 'ROOT_NUM_FOUND',
  SET_LOGGED_IN = 'ROOT_SET_LOGGED_IN',
  SET_SELECTED_DOCS = 'ROOT_SET_SELECTED_DOCS',
  SET_USER_DATA = 'ROOT_SET_USER_DATA',
}

type SET_DOCS = {
  type: RootTransitionType.SET_DOCS;
  payload: { docs: IRootMachineContext['result']['docs'] };
};
type SET_NUM_FOUND = {
  type: RootTransitionType.SET_NUM_FOUND;
  payload: { numFound: IRootMachineContext['result']['numFound'] };
};
type SET_SELECTED_DOCS = {
  type: RootTransitionType;
  payload: { selectedDocs: IRootMachineContext['selectedDocs'] };
};
type SET_USER_DATA = {
  type: RootTransitionType;
  payload: { user: IRootMachineContext['user'] };
};

type RootTransition =
  | SET_DOCS
  | SET_NUM_FOUND
  | SET_SELECTED_DOCS
  | SET_USER_DATA;

export const initialRootState: IRootMachineContext = {
  user: {
    username: 'anonymous',
    anonymous: true,
    access_token: '',
    expire_in: '',
  },
  result: {
    docs: [],
    numFound: 0,
  },
  selectedDocs: [],
};

export type RootSchema = {
  states: {
    idle: Record<string, unknown>;
  };
};

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
        [RootTransitionType.SET_USER_DATA]: { actions: 'setUserData' },
      },
    },
  },
};

const options: Partial<MachineOptions<IRootMachineContext, any>> = {
  actions: {
    setDocs: assign<IRootMachineContext, SET_DOCS>({
      result: (ctx, evt) => ({ ...ctx.result, docs: evt.payload.docs }),
    }),
    setNumFound: assign<IRootMachineContext, SET_NUM_FOUND>({
      result: (ctx, evt) => ({ ...ctx.result, numFound: evt.payload.numFound }),
    }),
    setSelectedDocs: assign<IRootMachineContext, SET_SELECTED_DOCS>({
      selectedDocs: (ctx, evt) => evt.payload.selectedDocs,
    }),
    setUserData: assign<IRootMachineContext, SET_USER_DATA>({
      user: (ctx, evt) => evt.payload.user,
    }),
  },
};

const rootMachine = Machine<IRootMachineContext, RootSchema, RootTransition>(
  config,
  options
);

export const rootService = interpret(rootMachine, { devTools: true });

// start the interpreted machine
rootService.start();
