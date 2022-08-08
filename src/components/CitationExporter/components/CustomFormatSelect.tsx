import { Sender } from '@xstate/react/lib/types';
import { CitationExporterEvent } from '../CitationExporter.machine';

export interface ICustomFormatSelectProps {
  dispatch: Sender<CitationExporterEvent>;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const CustomFormatSelect = (props: ICustomFormatSelectProps) => {
  return <div>Coming soon!</div>;
};
