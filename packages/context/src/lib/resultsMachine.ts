/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { IDocsEntity } from '@nectar/api';
import {
  Actor,
  assign,
  Interpreter,
  Machine,
  MachineConfig,
  MachineOptions,
  spawn,
} from 'xstate';
import {
  IDocMachine,
  initialState as initialDocMachineState,
  machine as docMachine,
  Transition as IDocTransition,
} from './docMachine';

export interface Schema {
  states: {
    initial: Record<string, unknown>;
    idle: Record<string, unknown>;
    fetchingHighlights: Record<string, unknown>;
  };
}

type SetDocs = {
  type: 'RESULTS.SET_DOCS';
  payload: { docs: IDocsEntity['id'][] };
};

type Select = {
  type: 'RESULTS.SELECT';
  payload: { id: IDocsEntity['id'] };
};

type UnSelect = {
  type: 'RESULTS.UNSELECT';
  payload: { id: IDocsEntity['id'] };
};

type Highlights = {
  type: 'RESULTS.HIGHLIGHTS';
};

export type Transition = SetDocs | Select | UnSelect | Highlights;

export interface Context {
  docRefs: Record<string, Actor<IDocMachine['state'], IDocTransition>>;
  selected: IDocsEntity['id'][];
}

export type IResultsMachine = Interpreter<Context, Schema, Transition>;

const initialState: Context = {
  docRefs: {},
  selected: [],
};

const config: MachineConfig<Context, Schema, Transition> = {
  key: 'results',
  initial: 'initial',
  context: initialState,
  states: {
    initial: {
      always: 'idle',
    },
    idle: {
      on: {
        'RESULTS.SET_DOCS': {
          actions: ['reset', 'setDocs'],
        },
        'RESULTS.SELECT': {
          actions: 'select',
        },
        'RESULTS.UNSELECT': {
          actions: 'unselect',
        },
        'RESULTS.HIGHLIGHTS': 'fetchingHighlights',
      },
    },
    fetchingHighlights: {
      invoke: {
        id: 'fetchHighlights',
        src: 'fetchHighlights',
        onDone: {
          target: 'idle',
          actions: 'sendHighlightsToChildren',
        },
        onError: {
          target: 'idle',
        },
      },
    },
  },
};

const options: Partial<MachineOptions<Context, any>> = {
  actions: {
    reset: assign<Context>(() => initialState),
    setDocs: assign<Context, SetDocs>((ctx, evt) => {
      console.log('spawning docs', evt.payload);

      // stop all running children
      Object.values(ctx.docRefs).forEach(d => {
        if (typeof d.stop === 'function') {
          d.stop();
        }
      });

      // spawn new actors (children) from payload
      const docRefs = evt.payload.docs.reduce(
        (acc, id) => ({
          ...acc,
          [id]: spawn(
            docMachine.withContext({ ...initialDocMachineState, id }),
            { name: `doc-${id}` }
          ),
        }),
        {}
      );
      return { docRefs };
    }),
    // sendHighlightsToChildren: assign<Context, any>((ctx, evt) => {
    //   for (const doc in ctx.docRefs) {
    //     send(
    //       { type: 'SET_HIGHLIGHTS', payload: { highlights: evt.data } },
    //       { to: doc }
    //     );
    //   }
    //   return ctx;
    // }),
    select: assign<Context, Select>({
      selected: (ctx, evt) => [...ctx.selected, evt.payload.id],
    }),
    unselect: assign<Context, UnSelect>({
      selected: (ctx, evt) => ctx.selected.filter(id => id !== evt.payload.id),
    }),
  },
  services: {
    // fetchHighlights: async ctx => {
    //   const { access_token: token } = await Adsapi.bootstrap();
    //   const adsapi = new Adsapi({ token });
    //   const response = await adsapi.search.query({
    //     q: '',
    //     hl: true,
    //     'hl.fl': 'title,abstract,body,ack,*',
    //     'hl.maxAnalyzedChars': 150000,
    //     'hl.requireFieldMatch': true,
    //     'hl.usePhraseHighlighter': true,
    //   });
    //   console.log('highlights', response);
    //   return response;
    // },
  },
};

export const machine = Machine<Context, Schema, Transition>(config, options);
