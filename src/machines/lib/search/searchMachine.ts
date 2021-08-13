/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { equals } from 'ramda';
import { assign, Machine, MachineConfig, MachineOptions } from 'xstate';
import { Context, Schema, SET_PARAMS, Transition, TransitionType } from './types';

export const initialContext: Context = {
  params: {
    q: '',
    sort: [],
    rows: 10,
    start: 0,
  },
  result: {
    docs: [],
    numFound: 0,
  },
  error: {
    message: '',
    name: '',
    stack: '',
  },
  pagination: {
    page: 1,
    numPerPage: 10,
  },
};

const config: MachineConfig<Context, Schema, Transition> = {
  key: 'search',
  initial: 'initial',
  context: initialContext,
  states: {
    initial: {
      always: 'success',
    },
    idle: {
      entry: 'reset',
      on: {
        [TransitionType.SEARCH]: { target: 'fetching', cond: 'validQuery' },
        [TransitionType.SET_PAGINATION]: [
          { actions: 'setPagination', target: 'fetching', cond: 'paginationHasChangedAndIsValid' },
        ],
        [TransitionType.SET_PARAMS]: [
          {
            target: 'fetching',
            cond: 'sortHasChanged',
            actions: 'setParams',
          },
          {
            actions: 'setParams',
          },
        ],
      },
    },
    fetching: {
      invoke: {
        id: 'fetchResults',
        src: 'fetchResult',
        onDone: {
          actions: 'setResult',
          target: 'success',
        },
        onError: {
          actions: 'setError',
          target: 'failure',
        },
      },
    },
    success: {
      on: {
        [TransitionType.SET_PARAMS]: [
          {
            target: 'idle',
            actions: 'setParams',
          },
        ],
        [TransitionType.SET_PAGINATION]: [
          { actions: 'setPagination', target: 'fetching', cond: 'paginationHasChangedAndIsValid' },
        ],
      },
    },
    failure: {
      on: {
        [TransitionType.SEARCH]: { target: 'fetching', cond: 'validQuery' },
        [TransitionType.SET_PARAMS]: [
          {
            target: 'fetching',
            cond: 'sortHasChanged',
            actions: 'setParams',
          },
          {
            actions: 'setParams',
          },
        ],
      },
    },
  },
};

const options: Partial<MachineOptions<Context, any>> = {
  guards: {
    validQuery: (ctx) => typeof ctx.params.q === 'string' && ctx.params.q.length > 0,
    sortHasChanged: (_ctx, evt) => Object.keys(evt.payload.params).includes('sort'),
    paginationHasChangedAndIsValid: (ctx, evt) => {
      const { page = ctx.pagination.page, numPerPage = ctx.pagination.numPerPage } = evt.payload
        .pagination as Context['pagination'];
      const totalPages = Math.ceil(ctx.result.numFound / numPerPage) || 1;

      if (
        // check if pagination actually changed
        equals(ctx.pagination, { ...ctx.pagination, ...evt.payload.pagination }) ||
        // basic page range check
        page <= 0 ||
        page > totalPages ||
        // check that numPerPage is one of our specified values
        ![10].includes(numPerPage)
      ) {
        return false;
      }
      return true;
    },
  },
  actions: {
    setParams: assign<Context, SET_PARAMS>({
      params: (ctx, evt) => ({ ...ctx.params, ...evt.payload.params }),
    }),
    setResult: assign({
      result: (_ctx, evt) => evt.data,
    }),
    setError: assign({
      error: (_ctx, evt) => evt.data,
    }),
    reset: assign({
      error: () => initialContext.error,
    }),
    setPagination: assign({
      pagination: (ctx, evt) => ({ ...ctx.pagination, ...evt.payload.pagination }),
      params: (ctx, evt) => {
        const { page = ctx.pagination.page, numPerPage = ctx.pagination.numPerPage } = evt.payload
          .pagination as Context['pagination'];
        return { ...ctx.params, start: (page - 1) * numPerPage, rows: numPerPage };
      },
    }),
  },
};

export const searchMachine = Machine<Context, Schema, Transition>(config, options);
