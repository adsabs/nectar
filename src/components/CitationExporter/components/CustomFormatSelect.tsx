import { Sender } from 'xstate';
import { CitationExporterEvent } from '../CitationExporter.machine';

export interface ICustomFormatSelectProps {
  dispatch: Sender<CitationExporterEvent>;
}
export const CustomFormatSelect = (props: ICustomFormatSelectProps) => {
  return <div>Coming soon!</div>;
};
