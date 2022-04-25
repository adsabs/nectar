import {
  BIBTEX_ABS_DEFAULT_AUTHORCUTOFF,
  BIBTEX_DEFAULT_AUTHORCUTOFF,
  ExportApiFormatKey,
  ExportApiJournalFormat,
  IDocsEntity,
  IExportApiParams,
} from '@api';
import { assign, createMachine } from '@xstate/fsm';
import { IUseCitationExporterProps } from './useCitationExporter';

export interface ICitationExporterState {
  records: IDocsEntity['bibcode'][];
  range: [0, number];
  isCustomFormat: boolean;
  singleMode: boolean;
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
  | { type: 'SUBMIT' }
  | { type: 'DONE' };

export const getExportCitationDefaultContext = (props: IUseCitationExporterProps): ICitationExporterState => {
  const { records = [], format = ExportApiFormatKey.bibtex, singleMode } = props;
  return {
    records,
    range: [0, records.length],
    isCustomFormat: false,
    singleMode,
    params: {
      format,
      bibcode: records,
      sort: ['date desc'],
      authorcutoff: [
        format === ExportApiFormatKey.bibtex
          ? BIBTEX_DEFAULT_AUTHORCUTOFF
          : format === ExportApiFormatKey.bibtexabs
          ? BIBTEX_ABS_DEFAULT_AUTHORCUTOFF
          : 0,
      ],
      customFormat: null,
      journalformat: [ExportApiJournalFormat.AASTeXMacros],
      maxauthor: [0],
    },
  };
};

export const generateMachine = ({ format, records, singleMode }: IUseCitationExporterProps) => {
  return createMachine<ICitationExporterState, CitationExporterEvent>({
    context: getExportCitationDefaultContext({ format, records, singleMode }),
    id: 'citationExporter',
    initial: singleMode ? 'idle' : 'fetching',
    states: {
      idle: {
        on: {
          SET_RECORDS: {
            actions: assign<ICitationExporterState, SetRecords>({
              records: (_ctx, evt) => evt.payload,
            }),
          },
          SET_SORT: {
            actions: assign<ICitationExporterState, SetSort>({
              params: (ctx, evt) => ({ ...ctx.params, sort: evt.payload }),
            }),
          },
          SET_FORMAT: {
            actions: assign<ICitationExporterState, SetFormat>({
              params: (ctx, evt) => ({ ...ctx.params, format: evt.payload }),
            }),
            target: 'fetching',

            // will transition to fetching only if singleMode is true
            cond: () => singleMode,
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
              params: (ctx) => ({ ...ctx.params, format: ExportApiFormatKey.custom }),
            }),
            target: 'fetching',
          },
          SUBMIT: 'fetching',
        },
      },
      fetching: {
        on: {
          DONE: 'idle',
        },
      },
    },
  });
};
