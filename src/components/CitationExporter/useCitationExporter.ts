import { useMachine } from '@xstate/react/fsm';
import { ExportApiFormatKey, useGetExportCitation } from '@_api/export';
import { useMemo } from 'react';
import { generateMachine, ICitationExporterState } from './CitationExporter.machine';

export interface IUseCitationExporterProps {
  records: ICitationExporterState['records'];
  format: ExportApiFormatKey;
  singleMode: boolean;
}

export const useCitationExporter = ({ records, format, singleMode }: IUseCitationExporterProps) => {
  const machine = useMemo(() => generateMachine({ format, records }), [records, format]);
  const [state, dispatch] = useMachine(machine);

  const fetcherProps = useGetExportCitation(state.context.params, {
    enabled: singleMode || state.matches('fetching'),
    keepPreviousData: true,
    onSettled: () => dispatch({ type: 'DONE' }),
  });

  return { ...fetcherProps, state, dispatch };
};
