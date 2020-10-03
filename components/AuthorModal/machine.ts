import { SearchPayload } from '@api/search';
import axios from 'axios';
import { Author } from 'pages/abs/[id]/authors';
import { map, transpose } from 'ramda';
import { assign, Machine, send, spawn } from 'xstate';

/**
 * handles the toggling open/close of a dialog component.
 */

interface DialogSchema {
  states: {
    opened: {};
    closed: {};
  };
}

type DialogEvent = { type: 'TOGGLE' };

export const dialogMachine = Machine<DialogSchema, DialogEvent>({
  id: 'dialog',
  initial: 'closed',
  states: {
    closed: { on: { TOGGLE: 'opened' } },
    opened: { on: { TOGGLE: 'closed' } },
  },
});

interface AuthorTableSchema {
  states: {
    idle: {};
    loading: {};
    loaded: {};
    failure: {};
  };
}

interface AuthorTableContext {
  id: string;
  authors: Author[];
  pager: any;
}

type AuthorTableEvent = { type: 'FETCH' } | { type: 'RESET' };

/**
 * Fetching FSM for getting the list of authors from the api
 * This will also spawn a pagination service for use with the table component on the UI
 *
 * @param id {string} - article identifier
 */
export const createAuthorTableMachine = (id: string) => {
  return Machine<AuthorTableContext, AuthorTableSchema, AuthorTableEvent>({
    id: 'author-table',
    initial: 'idle',
    context: {
      id,
      authors: [],
      pager: null,
    },
    states: {
      idle: {
        on: { FETCH: 'loading' },
      },
      loading: {
        invoke: {
          id: 'fetch-authors',
          src: fetchAuthors,
          onDone: {
            target: 'loaded',
            actions: assign({
              authors: (_, event) => event.data,
            }),
          },
          onError: 'failure',
        },
      },
      loaded: {
        entry: assign({
          pager: (ctx) => spawn(createPaginationMachine(ctx.authors), 'pager'),
        }),
      },
      failure: {
        on: { RESET: 'idle' },
      },
    },
  });
};

/**
 * Fetch the authors and transform the response to fit our internal format
 *
 * @param context {AuthorTableContext} - context object
 */
const fetchAuthors = async (context: AuthorTableContext) => {
  const { id } = context;
  const query = `id:${id}`;
  const fields = 'id,author,aff,orcid_pub';

  const { data } = await axios.get<SearchPayload>('/api/search', {
    params: { q: query, fl: fields },
  });

  const { author, aff, orcid_pub } = data?.response.docs[0];
  return map(
    ([author, aff, orcid_pub]) => ({
      name: author,
      aff,
      orcid: orcid_pub,
    }),
    transpose([author, aff, orcid_pub])
  );
};

interface PaginationSchema {
  states: {
    paging: {};
  };
}

export interface PaginationContext {
  authors: Author[];
  count: number;
  rowsPerPage: number;
  page: number;
  rows: Author[];
}

export type PaginationEvent =
  | { type: 'UPDATE_PER_PAGE'; value: number }
  | { type: 'UPDATE_PAGE'; value: number };

/**
 * Pagination FSM, this holds the simple logic for updating the number of rows to show and
 * passing the other props to the pagination component
 *
 * @param authors {Authors[]} - set of authors
 */
export const createPaginationMachine = (authors: Author[]) => {
  return Machine<PaginationContext, PaginationSchema, PaginationEvent>(
    {
      id: 'pagination',
      initial: 'paging',
      context: {
        authors,
        count: authors.length,
        rowsPerPage: 25,
        page: 0,
        rows: [],
      },
      states: {
        paging: {
          entry: 'updateRows',
          on: {
            UPDATE_PER_PAGE: {
              // update the perPage value and reset back to first page
              actions: [
                'updatePerPage',
                send({ type: 'UPDATE_PAGE', value: 0 }),
              ],
            },
            UPDATE_PAGE: {
              // when page updates, also regenerate rows
              actions: ['updatePage', 'updateRows'],
            },
          },
        },
      },
    },
    {
      actions: {
        updatePerPage: assign({
          rowsPerPage: (_, event) => event.value,
        }),
        updatePage: assign({
          page: (_, event) => event.value,
        }),
        updateRows: assign({
          rows: (ctx) => {
            const { page, rowsPerPage } = ctx;
            return ctx.authors.slice(
              page * rowsPerPage,
              page * rowsPerPage + rowsPerPage
            );
          },
        }),
      },
    }
  );
};
