import { useMachine } from '@xstate/react/fsm';
import { ExportApiFormatKey, useGetExportCitation } from '@_api/export';
import { useEffect, useMemo } from 'react';
import { generateMachine, ICitationExporterState } from './CitationExporter.machine';

export interface IUseCitationExporterProps {
  records: ICitationExporterState['records'];
  format: ExportApiFormatKey;
  singleMode: boolean;
}

export const useCitationExporter = ({ records, format, singleMode }: IUseCitationExporterProps) => {
  const machine = useMemo(() => generateMachine({ format, records, singleMode }), []);
  const [state, dispatch] = useMachine(machine);

  // trigger updates to machine state if incoming props change
  useEffect(() => dispatch({ type: 'SET_RECORDS', payload: records }), [records]);
  useEffect(() => dispatch({ type: 'SET_FORMAT', payload: format }), [format]);
  useEffect(() => dispatch({ type: 'SET_SINGLEMODE', payload: singleMode }), [singleMode]);

  const result = useGetExportCitation(state.context.params, {
    enabled: state.matches('fetching'),
    keepPreviousData: true,

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

  return { ...result, state, dispatch };
};
