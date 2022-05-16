import { ExportApiFormatKey, SolrSort, useGetExportCitation } from '@api';
import { useMachine } from '@xstate/react/fsm';
import { useEffect, useMemo } from 'react';
import { generateMachine, ICitationExporterState } from './CitationExporter.machine';

export interface IUseCitationExporterProps {
  records: ICitationExporterState['records'];
  format: ExportApiFormatKey;
  singleMode: boolean;
  sort?: SolrSort[];
}

export const useCitationExporter = ({ records, format, singleMode, sort }: IUseCitationExporterProps) => {
  const machine = useMemo(() => generateMachine({ format, records, singleMode, sort }), []);
  const [state, dispatch] = useMachine(machine);

  // trigger updates to machine state if incoming props change
  useEffect(() => dispatch({ type: 'SET_SINGLEMODE', payload: singleMode }), [singleMode]);
  useEffect(() => {
    if (format !== state.context.params.format) {
      dispatch({ type: 'SET_FORMAT', payload: format });
    }
  }, [format]);
  useEffect(() => {
    // naively compare only the first record, this should be enough to determine
    // there is a difference
    if (records[0] !== state.context.records[0]) {
      dispatch({ type: 'SET_RECORDS', payload: records });
    }
  }, [records]);
  useEffect(() => {
    if (sort !== state.context.params.sort) {
      dispatch({ type: 'SET_SORT', payload: sort });
    }
  }, [sort]);

  const result = useGetExportCitation(state.context.params, {
    enabled: state.matches('fetching'),
    keepPreviousData: state.matches('idle'),

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
  }, [result.data]);

  // safety hatch, in case for some reason we get stuck in fetching mode
  useEffect(() => {
    if (state.matches('fetching')) {
      setTimeout(() => dispatch({ type: 'DONE' }), 5000);
    }
  }, [state.value]);

  return { ...result, state, dispatch };
};
