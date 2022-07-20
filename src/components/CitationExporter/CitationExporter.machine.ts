import {
  BIBTEX_ABS_DEFAULT_MAX_AUTHOR,
  BIBTEX_DEFAULT_AUTHOR_CUTOFF,
  BIBTEX_DEFAULT_MAX_AUTHOR,
  ExportApiFormatKey,
  ExportApiJournalFormat,
  IDocsEntity,
  IExportApiParams,
} from '@api';
import { normalizeSolrSort } from '@utils';
import { assign, createMachine } from '@xstate/fsm';
import { equals } from 'ramda';
import { IUseCitationExporterProps } from './useCitationExporter';

export interface ICitationExporterState {
  records: IDocsEntity['bibcode'][];
  range: [0, number];
  isCustomFormat: boolean;
  singleMode: boolean;
  prevParams: IExportApiParams;
  params: IExportApiParams;
}

interface SetSingleMode {
  type: 'SET_SINGLEMODE';
  payload: ICitationExporterState['singleMode'];
}
interface SetRecords {
  type: 'SET_RECORDS';
  payload: ICitationExporterState['records'];
}

interface SetSort {
  type: 'SET_SORT';
  payload: ICitationExporterState['params']['sort'];
}

interface SetFormat {
  type: 'SET_FORMAT';
  payload: ExportApiFormatKey;
}

interface SetKeyFormat {
  type: 'SET_KEY_FORMAT';
  payload: string;
}

interface SetRange {
  type: 'SET_RANGE';
  payload: number;
}

interface SetAuthorCutoff {
  type: 'SET_AUTHOR_CUTOFF';
  payload: number;
}

interface SetMaxAuthor {
  type: 'SET_MAX_AUTHOR';
  payload: number;
}

interface SetJournalFormat {
  type: 'SET_JOURNAL_FORMAT';
  payload: ExportApiJournalFormat;
}

interface SetIsCustomFormat {
  type: 'SET_IS_CUSTOM_FORMAT';
  payload: boolean;
}

export type CitationExporterEvent =
  | SetRecords
  | SetSingleMode
  | SetSort
  | SetFormat
  | SetRange
  | SetAuthorCutoff
  | SetMaxAuthor
  | SetJournalFormat
  | SetIsCustomFormat
  | SetKeyFormat
  | { type: 'SUBMIT' }
  | { type: 'FORCE_SUBMIT' }
  | { type: 'DONE' };

export const getExportCitationDefaultContext = (props: IUseCitationExporterProps): ICitationExporterState => {
  const { records = [], format = ExportApiFormatKey.bibtex, singleMode, sort = ['date desc'] } = props;
  const params: IExportApiParams = {
    format,
    bibcode: records,
    sort,
    authorcutoff: [BIBTEX_DEFAULT_AUTHOR_CUTOFF],
    customFormat: null,
    journalformat: [ExportApiJournalFormat.AASTeXMacros],
    keyformat: ['%R'],
    maxauthor: [
      format === ExportApiFormatKey.bibtex
        ? BIBTEX_DEFAULT_MAX_AUTHOR
        : format === ExportApiFormatKey.bibtexabs
        ? BIBTEX_ABS_DEFAULT_MAX_AUTHOR
        : 0,
    ],
  };
  return {
    records,
    range: [0, records.length],
    isCustomFormat: false,
    singleMode,
    prevParams: params,
    params,
  };
};

export const generateMachine = ({ format, records, singleMode, sort }: IUseCitationExporterProps) => {
  return createMachine<ICitationExporterState, CitationExporterEvent>({
    context: getExportCitationDefaultContext({ format, records, singleMode, sort }),
    id: 'citationExporter',
    initial: 'idle',
    states: {
      idle: {
        on: {
          SET_RECORDS: {
            actions: assign<ICitationExporterState, SetRecords>({
              records: (_ctx, evt) => evt.payload,

              // set the new records on params, respecting the current range
              params: (ctx, evt) => ({
                ...ctx.params,
                bibcode: evt.payload.slice(0, ctx.range[1]),
              }),
            }),
            target: 'fetching',
          },
          SET_SORT: {
            actions: assign<ICitationExporterState, SetSort>({
              params: (ctx, evt) => ({ ...ctx.params, sort: normalizeSolrSort(evt.payload) }),
            }),
          },
          SET_FORMAT: [
            {
              actions: assign<ICitationExporterState, SetFormat>({
                params: (ctx, evt) => ({ ...ctx.params, format: evt.payload }),
              }),
            },
          ],
          SET_KEY_FORMAT: {
            actions: assign<ICitationExporterState, SetKeyFormat>({
              params: (ctx, evt) => ({ ...ctx.params, keyformat: [evt.payload] }),
            }),
          },
          SET_RANGE: {
            actions: assign<ICitationExporterState, SetRange>({
              range: (_ctx, evt) => [0, evt.payload],
              params: (ctx, evt) => ({
                ...ctx.params,
                bibcode: ctx.records.slice(0, evt.payload <= 0 ? 1 : evt.payload),
              }),
            }),
          },
          SET_AUTHOR_CUTOFF: {
            actions: assign<ICitationExporterState, SetAuthorCutoff>({
              params: (ctx, evt) => ({ ...ctx.params, authorcutoff: [evt.payload] }),
            }),
          },
          SET_MAX_AUTHOR: {
            actions: assign<ICitationExporterState, SetMaxAuthor>({
              params: (ctx, evt) => ({ ...ctx.params, maxauthor: [evt.payload] }),
            }),
          },
          SET_JOURNAL_FORMAT: {
            actions: assign<ICitationExporterState, SetJournalFormat>({
              params: (ctx, evt) => ({ ...ctx.params, journalformat: [evt.payload] }),
            }),
          },
          SET_IS_CUSTOM_FORMAT: {
            actions: assign<ICitationExporterState, SetIsCustomFormat>({
              isCustomFormat: (_ctx, evt) => evt.payload,
              // params: (ctx) => ({ ...ctx.params, format: ExportApiFormatKey.custom }),
            }),
          },
          SUBMIT: { target: 'fetching', cond: (ctx) => !equals(ctx.prevParams, ctx.params) },
          FORCE_SUBMIT: 'fetching',
        },
      },
      fetching: {
        on: {
          DONE: {
            target: 'idle',
            actions: assign<ICitationExporterState>({
              prevParams: (ctx) => ctx.params,
            }),
          },
        },
      },
    },
  });
};
