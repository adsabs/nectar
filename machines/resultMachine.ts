const foo = () => {};

export default foo;

// import { DocsEntity, SearchPayload } from '@api/search';
// import axios from 'axios';
// import { Actor, assign, Machine, spawn } from 'xstate';

// const fetchResults = async (context: ResultMachineContext) => {
//   const { query } = context;

//   const {
//     data: {
//       response: { numFound, docs },
//     },
//   } = await axios.get<SearchPayload>('/api/search', {
//     params: { q: query },
//   });

//   return {
//     numFound,
//     docs,
//   };
// };

// export interface ResultMachineSchema {
//   states: {
//     idle: {};
//     loading: {};
//     loaded: {};
//     failure: {};
//   };
// }

// export interface ResultMachineContext {
//   searchBarRef: Actor<QueryMachineContext, QueryMachineEvent> | null;
//   result: {
//     docs: DocsEntity[];
//     numFound: number;
//   };
// }

// export type ResultMachineEvent =
//   | { type: 'FETCH' }
//   | { type: 'UPDATE_QUERY'; value: string };

// interface QueryMachineContext {
//   query: string;
// }
// interface QueryMachineSchema {
//   states: {
//     editing: {};
//     done: {};
//   };
// }
// type QueryMachineEvent = { type: 'UPDATE'; value: string };

// const queryMachine = Machine<
//   QueryMachineContext,
//   QueryMachineSchema,
//   QueryMachineEvent
// >({
//   id: 'search-query',
//   initial: 'editing',
//   context: {
//     query: '',
//   },
//   states: {
//     editing: {
//       on: {
//         UPDATE: {
//           actions: assign({
//             query: (_, event) => event.value,
//           }),
//         },
//       },
//     },
//     done: {
//       type: 'final',
//     },
//   },
// });

// const resultMachine = Machine<
//   ResultMachineContext,
//   ResultMachineSchema,
//   ResultMachineEvent
// >({
//   initial: 'idle',
//   context: {
//     searchBarRef: null,
//     result: {
//       docs: [],
//       numFound: 0,
//     },
//   },
//   states: {
//     idle: {
//       entry: assign({
//         searchBarRef: () => spawn(queryMachine),
//       }),
//       on: {
//         FETCH: 'loading',
//       },
//     },
//     loading: {
//       invoke: {
//         id: 'fetch-result',
//         src: fetchResults,
//         onDone: {
//           target: 'loaded',
//           actions: assign({
//             result: (_, event) => event.data,
//           }),
//         },
//         onError: 'failure',
//       },
//     },
//     loaded: {},
//     failure: {},
//   },
// });

// export default resultMachine;
