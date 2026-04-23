import { useMachine } from '@xstate/react/fsm';
import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { generateMachine, ICitationExporterState } from './CitationExporter.machine';
import { purifyString } from '@/utils/common/formatters';
import { ExportApiJournalFormat, IExportApiParams } from '@/api/export/types';
import { SolrSort } from '@/api/models';
import { exportCitationKeys, fetchExportCitation, useGetExportCitation } from '@/api/export/export';
import { useExportSpan } from '@/lib/useExportSpan';

export interface IUseCitationExporterProps {
  records: ICitationExporterState['records'];
  format: string;
  customFormat?: string;
  keyformat?: string;
  journalformat?: ExportApiJournalFormat;
  authorcutoff?: number;
  maxauthor?: number;
  singleMode: boolean;
  sort?: SolrSort[];
}

export const useCitationExporter = ({
  records,
  format,
  customFormat,
  keyformat,
  journalformat,
  authorcutoff,
  maxauthor,
  singleMode,
  sort,
  ...rest
}: IUseCitationExporterProps) => {
  // Machine must only be created once — recreating it on prop change resets state.
  // Props flow into the machine via dispatch actions below.
  const machine = useMemo(
    () =>
      generateMachine({
        format,
        keyformat,
        customFormat,
        journalformat,
        authorcutoff,
        maxauthor,
        records,
        singleMode,
        sort,
        ...rest,
      }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [state, dispatch] = useMachine(machine);
  const queryClient = useQueryClient();

  // clean params before submitting to API
  const params: IExportApiParams = {
    ...state.context.params,
    keyformat: [purifyString(state.context.params.keyformat[0])],
  };

  // On mount only: check cache and prefetch if missing. Must not re-run on
  // subsequent renders — doing so would re-trigger the initial load on every
  // format/record change, bypassing the state machine's normal flow.
  useEffect(() => {
    (async () => {
      const queryKey = exportCitationKeys.primary(params);
      const cached = queryClient.getQueryData<IExportApiParams>(queryKey);

      if (!cached) {
        // no cached value, prefetch and submit it here since we know the params
        await queryClient.prefetchQuery({
          queryKey,
          queryFn: fetchExportCitation,
          meta: { params },
        });
        dispatch('SUBMIT');
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // trigger updates to machine state if incoming props change
  useEffect(() => dispatch({ type: 'SET_SINGLEMODE', payload: singleMode }), [singleMode, dispatch]);

  // watch for format changes
  useEffect(() => {
    if (format !== params.format) {
      dispatch({ type: 'SET_FORMAT', payload: format });
    }
  }, [format, params.format, dispatch]);

  // if we're in singleMode and format is changed, trigger a submit
  useEffect(() => {
    if (singleMode) {
      dispatch('SUBMIT');
    }
  }, [params.format, singleMode, dispatch]);

  // watch for changes to records
  useEffect(() => {
    // naively compare only the first record, this should be enough to determine
    // there is a difference
    if (records[0] !== state.context.records[0]) {
      dispatch({ type: 'SET_RECORDS', payload: records });
    }
  }, [records, state.context.records, dispatch]);

  // watch for changes to sort
  useEffect(() => {
    if (sort !== params.sort) {
      dispatch({ type: 'SET_SORT', payload: sort });
    }
  }, [sort, params.sort, dispatch]);

  // main result fetcher, this will not run unless we're in the 'fetching' state
  const result = useGetExportCitation(params, {
    enabled: state.matches('fetching'),

    // will re-throw error to allow error boundary to catch
    useErrorBoundary: true,

    // do not retry on fail
    retry: false,
  });

  useExportSpan(state.matches('fetching'), params.format, result.data);

  useEffect(() => {
    if (result.data) {
      // derive this state from data, since we don't know if it was fetched from cache or not
      dispatch({ type: 'DONE' });
    }
  }, [result.data, dispatch]);

  // safety hatch, in case for some reason we get stuck in fetching mode
  useEffect(() => {
    if (state.value === 'fetching' && result.data) {
      dispatch('DONE');
    }
  }, [state.value, result.data, dispatch]);

  return { ...result, state, dispatch };
};
