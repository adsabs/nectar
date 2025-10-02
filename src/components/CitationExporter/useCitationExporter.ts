import { useMachine } from '@xstate/react/fsm';
import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { generateMachine, ICitationExporterState } from './CitationExporter.machine';
import { purifyString } from '@/utils/common/formatters';
import { ExportApiJournalFormat, IExportApiParams } from '@/api/export/types';
import { SolrSort } from '@/api/models';
import { exportCitationKeys, fetchExportCitation, useGetExportCitation } from '@/api/export/export';

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
    [format, keyformat, customFormat, journalformat, authorcutoff, maxauthor, records, singleMode, sort, rest],
  );
  const [state, dispatch] = useMachine(machine);
  const queryClient = useQueryClient();

  // clean params before submitting to API
  const params: IExportApiParams = {
    ...state.context.params,
    keyformat: [purifyString(state.context.params.keyformat[0])],
  };

  // on mount, check the cache to see if we any records for this querykey, if not, we should trigger an initial load
  // should usually have an entry since the data will be available from SSR
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // trigger updates to machine state if incoming props change
  useEffect(() => dispatch({ type: 'SET_SINGLEMODE', payload: singleMode }), [singleMode, dispatch]);

  // watch for format changes
  useEffect(() => {
    if (format !== params.format) {
      dispatch({ type: 'SET_FORMAT', payload: format });
    }
  }, [format, dispatch, params.format]);

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
  }, [records, dispatch, state.context.records]);

  // watch for changes to sort
  useEffect(() => {
    if (sort !== params.sort) {
      dispatch({ type: 'SET_SORT', payload: sort });
    }
  }, [sort, dispatch, params.sort]);

  // main result fetcher, this will not run unless we're in the 'fetching' state
  const result = useGetExportCitation(params, {
    enabled: state.matches('fetching'),

    // will re-throw error to allow error boundary to catch
    useErrorBoundary: true,

    // do not retry on fail
    retry: false,
  });

  useEffect(() => {
    if (result.data) {
      // derive this state from data, since we don't know if it was fetched from cache or not
      dispatch({ type: 'DONE' });
    }
  }, [result.data, dispatch]);

  // safety hatch, in case for some reason we get stuck in fetching mode
  useEffect(() => {
    if (state.matches('fetching') && result.data) {
      dispatch('DONE');
    }
  }, [state.value, result.data, dispatch, state]);

  return { ...result, state, dispatch };
};
