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
  const machine = useMemo(() => generateMachine({ format, records, singleMode }), [records, format, singleMode]);
  const [state, dispatch] = useMachine(machine);

  const result = useGetExportCitation(state.context.params, {
    enabled: state.matches('fetching'),
    keepPreviousData: true,
  });

  useEffect(() => {
    if (result.data) {
      // derive this state from data, since we don't know if it was fetched from cache or not
      dispatch({ type: 'DONE' });
    }
  }, [result.data]);

  return { ...result, state, dispatch };
};
