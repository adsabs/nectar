import { assign, DoneInvokeEvent } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { ExportState } from './types';

export const initialContext: ExportState & { allowedToLoad: boolean } = {
  format: 'bibtex',
  limit: 0,
  bibcodes: [],
  text: '',
  customFormat: '',
  allowedToLoad: true,
  singleMode: false,
  loadInitially: true,
};

const exportModel = createModel(initialContext, {
  events: {
    load: () => ({}),
    updateText: (text: ExportState['text']) => ({ text }),
    updateCustomFormat: (customFormat: ExportState['customFormat']) => ({ customFormat }),
    updateFormat: (format: ExportState['format']) => ({ format }),
    updateLimit: (limit: ExportState['limit']) => ({ limit }),
  },
});

export const exportMachine = exportModel.createMachine(
  {
    id: 'exportcitation',
    initial: 'init',
    states: {
      init: {
        always: [{ target: 'fetching', cond: 'canLoadInitially' }, { target: 'idle' }],
      },
      idle: {
        exit: exportModel.assign({
          allowedToLoad: false,
        }),
        on: {
          load: {
            target: '#exportcitation.fetching',
            cond: 'allowedToLoad',
          },
          updateFormat: {
            actions: exportModel.assign({
              format: (_, ev) => ev.format,
              allowedToLoad: true,
            }),
          },
          updateCustomFormat: {
            actions: exportModel.assign({
              customFormat: (ctx, ev) => ev.customFormat,
              allowedToLoad: true,
            }),
          },
          updateLimit: {
            actions: exportModel.assign({
              limit: (_, ev) => ev.limit,
              allowedToLoad: true,
            }),
          },
        },
      },
      fetching: {
        initial: 'inactive',
        states: {
          inactive: {
            always: [
              {
                target: 'fetchingCitations',
                cond: 'shouldFetchCitations',
              },
              {
                target: 'fetchingBibcodes',
                cond: 'shouldFetchBibcodes',
              },
              { target: '#exportcitation.idle' },
            ],
          },
          fetchingBibcodes: {
            invoke: {
              src: 'fetchBibcodes',
              onDone: {
                target: 'fetchingCitations',
                actions: assign<ExportState, DoneInvokeEvent<ExportState['bibcodes']>>({
                  limit: (_, ev) => ev.data.length,
                  bibcodes: (_, ev) => ev.data,
                }),
              },
              onError: {
                target: '#exportcitation.idle',
              },
            },
          },
          fetchingCitations: {
            invoke: {
              src: 'fetchCitations',
              onDone: {
                target: '#exportcitation.idle',
                actions: assign<ExportState, DoneInvokeEvent<ExportState['text']>>({
                  text: (_, ev) => ev.data,
                }),
              },
              onError: {
                target: '#exportcitation.idle',
              },
            },
          },
        },
      },
    },
  },
  {
    guards: {
      allowedToLoad: (ctx) => ctx.allowedToLoad,
      canLoadInitially: (ctx) => {
        const formatNotCustom = ctx.format !== 'custom';
        return ctx.loadInitially && formatNotCustom;
      },
      shouldFetchBibcodes: (ctx) => {
        /**
         * Fetching bibcodes from solr, if we *do not* have any bibcodes already
         * and we are allowed to load (context change happened)
         */
        const noBibcodes = Array.isArray(ctx.bibcodes) && ctx.bibcodes.length === 0;
        return noBibcodes;
      },
      shouldFetchCitations: (ctx) => {
        /**
         * Fetching citations from /export, if we *do* have bibcodes already loaded
         * if format === 'custom' then check customFormat is valid
         * and we are allowed to load (context change happened)
         */
        if (ctx.format === 'custom' && ctx.customFormat.length === 0) {
          return false;
        }

        const hasBibcodes = Array.isArray(ctx.bibcodes) && ctx.bibcodes.length > 0;
        return hasBibcodes;
      },
    },
  },
);
