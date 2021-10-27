import { useAPI } from '@hooks';
import { useAppCtx } from '@store';
import { useMachine } from '@xstate/react';
import { useRouter } from 'next/router';
import { FormEvent, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Interpreter } from 'xstate';
import { exportFormats, MAX_RECORDS } from './constants';
import { exportMachine, initialContext } from './machine';
import { ExportState } from './types';

export interface IUseExportProps {
  initialFormat?: ExportState['format'];
  initialText?: ExportState['text'];
  initialBibcodes?: ExportState['bibcodes'];
  loadInitially?: boolean;
  singleMode: boolean;
}

export interface IUseExportReturns {
  state: Pick<ExportState, 'text' | 'format' | 'limit' | 'customFormat'> & {
    loading: boolean;
    totalRecords: number;
  };
  handlers: {
    onCustomFormatChange: (formatString: string) => void;
    onFormatChange: (format: ExportState['format']) => void;
    onLimitChange: (limit: ExportState['limit']) => void;
    onSubmit: (e?: FormEvent<HTMLFormElement>) => void;
    onDownload: () => void;
  };
  service: Interpreter<ExportState & { allowedToLoad: boolean }>;
}

export const useExportMachine = ({
  initialFormat = initialContext.format,
  initialText = initialContext.text,
  initialBibcodes = initialContext.bibcodes,
  loadInitially = initialContext.loadInitially,
  singleMode = initialContext.singleMode,
}: IUseExportProps): IUseExportReturns => {
  const { api } = useAPI();
  const {
    state: { query },
  } = useAppCtx();
  const [state, send, service] = useMachine(exportMachine, {
    devTools: true,
    context: {
      text: initialText,
      allowedToLoad: initialText === initialContext.text,
      bibcodes: initialBibcodes,
      limit: singleMode ? 1 : initialBibcodes.length,
      format: initialFormat,
      singleMode,
      loadInitially: initialText === initialContext.text && loadInitially,
    },
    services: {
      fetchBibcodes: async ({ limit }) => {
        if (typeof query === 'undefined' || query === null) {
          const error = new Error('No query found');
          toast.error(error.message);
          throw error;
        }

        const searchResult = await api.search.query({
          ...query,
          fl: ['bibcode'],
          rows: limit > 0 ? limit : MAX_RECORDS,
          start: 0,
        });

        const bibcodes = searchResult.match(
          ({ docs }) => docs.map((d) => d.bibcode),
          (e) => {
            toast.error(e.message);
            throw e;
          },
        );

        return bibcodes;
      },
      fetchCitations: async ({ format, customFormat, bibcodes, limit }) => {
        const exportResult = await api.export.getExportText({
          format,
          customFormat: [customFormat],
          bibcode: bibcodes.slice(0, limit === MAX_RECORDS ? undefined : limit),
        });
        const citations = exportResult.match<string>(
          (v) => v,
          (e) => {
            toast.error(e.message);
            throw e;
          },
        );

        return citations;
      },
    },
  });

  const onFormatChange = useCallback((format: ExportState['format']) => {
    send('updateFormat', { format });
    if (format !== 'custom' && singleMode) {
      send('load');
    }
  }, []);
  const onLimitChange = useCallback((limit: ExportState['limit']) => send('updateLimit', { limit }), []);
  const onCustomFormatChange = useCallback(
    (customFormat: ExportState['customFormat']) => send('updateCustomFormat', { customFormat }),
    [],
  );

  const onSubmit = useCallback((e?: FormEvent<HTMLFormElement>): void => {
    e?.preventDefault();
    send('load');
  }, []);

  const onDownload = useCallback(() => {
    const blob = new Blob([state.context.text], {
      type: 'text/plain;charset=utf-8',
    });
    const filename = `export-${state.context.format}.${exportFormats[state.context.format].ext}`;
    const link = document.createElement('a');
    link.setAttribute('href', window.URL.createObjectURL(blob));
    link.setAttribute('download', filename);
    link.click();
    link.remove();
  }, [state.context.text, state.context.format]);

  const router = useRouter();
  useEffect(() => {
    // on abstract urls, update the query as we change format
    if (/^\/abs\/.*\/exportcitation/.exec(router.asPath) && typeof router.query.id === 'string') {
      void router.replace(`/abs/${router.query.id}/exportcitation?format=${state.context.format}`, undefined, {
        shallow: true,
      });
    }
  }, [state.context.format, router.query.id]);

  return {
    state: {
      text: state.context.text,
      format: state.context.format,
      limit: state.context.limit,
      totalRecords: state.context.bibcodes.length,
      customFormat: state.context.customFormat,
      loading: state.matches('fetching'),
    },
    handlers: {
      onFormatChange,
      onLimitChange,
      onCustomFormatChange,
      onSubmit,
      onDownload,
    },
    service,
  };
};
