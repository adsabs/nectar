import { APP_DEFAULTS } from '@/config';
import { assign, createMachine } from '@xstate/fsm';
import { equals } from 'ramda';
import { IUseCitationExporterProps } from './useCitationExporter';
import { normalizeSolrSort } from '@/utils/common/search';
import { IDocsEntity } from '@/api/search/types';
import { ExportApiFormatKey, ExportApiJournalFormat, IExportApiParams } from '@/api/export/types';

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
  payload: { isCustomFormat: boolean };
}

interface SetCustomFormat {
  type: 'SET_CUSTOM_FORMAT';
  payload: string;
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
  | SetCustomFormat
  | SetKeyFormat
  | { type: 'SUBMIT' }
  | { type: 'FORCE_SUBMIT' }
  | { type: 'DONE' };

export const getMaxAuthor = (format: ExportApiFormatKey) => {
  switch (format) {
    case ExportApiFormatKey.bibtex:
      return APP_DEFAULTS.BIBTEX_DEFAULT_MAX_AUTHOR;
    case ExportApiFormatKey.bibtexabs:
      return APP_DEFAULTS.BIBTEX_ABS_DEFAULT_MAX_AUTHOR;
    default:
      return 0;
  }
};

export const getExportCitationDefaultContext = (props: IUseCitationExporterProps): ICitationExporterState => {
  const {
    records = [],
    format = ExportApiFormatKey.bibtex,
    customFormat = '%1H:%Y:%q',
    sort = ['date desc'],
    keyformat = '%R',
    journalformat = ExportApiJournalFormat.AASTeXMacros,
    authorcutoff = APP_DEFAULTS.BIBTEX_DEFAULT_AUTHOR_CUTOFF,
    singleMode = false,
  } = props;

  // maxauthor is different for bibtex and bibtexabs, unless it's set explicitly
  const maxauthor = props.maxauthor ?? getMaxAuthor(format);

  const params: IExportApiParams = {
    format,
    customFormat,
    bibcode: records,
    sort,
    authorcutoff: [authorcutoff],
    journalformat: [journalformat],
    keyformat: [keyformat],
    maxauthor: [maxauthor],
  };
  return {
    records,
    range: [0, records.length],
    isCustomFormat: format === ExportApiFormatKey.custom,
    singleMode,
    prevParams: params,
    params,
  };
};

export const generateMachine = ({
  format,
  customFormat,
  keyformat,
  journalformat,
  authorcutoff,
  maxauthor,
  records,
  singleMode,
  sort,
}: IUseCitationExporterProps) => {
  return createMachine<ICitationExporterState, CitationExporterEvent>({
    context: getExportCitationDefaultContext({
      format,
      keyformat,
      customFormat,
      journalformat,
      authorcutoff,
      maxauthor,
      records,
      singleMode,
      sort,
    }),
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
              params: (ctx, evt) => ({
                ...ctx.params,
                sort: normalizeSolrSort(evt.payload),
              }),
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
              params: (ctx, evt) => ({
                ...ctx.params,
                keyformat: [evt.payload],
              }),
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
              params: (ctx, evt) => ({
                ...ctx.params,
                authorcutoff: [evt.payload],
              }),
            }),
          },
          SET_MAX_AUTHOR: {
            actions: assign<ICitationExporterState, SetMaxAuthor>({
              params: (ctx, evt) => ({
                ...ctx.params,
                maxauthor: [evt.payload],
              }),
            }),
          },
          SET_JOURNAL_FORMAT: {
            actions: assign<ICitationExporterState, SetJournalFormat>({
              params: (ctx, evt) => ({
                ...ctx.params,
                journalformat: [evt.payload],
              }),
            }),
          },
          SET_IS_CUSTOM_FORMAT: {
            actions: assign<ICitationExporterState, SetIsCustomFormat>({
              isCustomFormat: (_ctx, evt) => evt.payload.isCustomFormat,
              params: (ctx, evt) => ({
                ...ctx.params,
                format: evt.payload.isCustomFormat ? ExportApiFormatKey.custom : ExportApiFormatKey.bibtex,
              }),
            }),
          },
          SET_CUSTOM_FORMAT: {
            actions: assign<ICitationExporterState, SetCustomFormat>({
              params: (ctx, evt) => ({
                ...ctx.params,
                customFormat: evt.payload,
              }),
            }),
          },
          SUBMIT: {
            target: 'fetching',
            cond: (ctx) => !equals(ctx.prevParams, ctx.params),
          },
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
