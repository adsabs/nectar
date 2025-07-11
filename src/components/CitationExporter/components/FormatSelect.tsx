import { Dispatch } from 'react';
import { CitationExporterEvent } from '../CitationExporter.machine';
import { Select } from '@/components/Select';
import { ExportApiFormatKey } from '@/api/export/types';
import { ExportFormatOption, useExportFormats } from '@/lib/useExportFormats';

export interface IFormatSelectProps {
  format: ExportApiFormatKey;
  dispatch: Dispatch<CitationExporterEvent>;
  isLoading?: boolean;
  label?: string;
}
export const FormatSelect = (props: IFormatSelectProps) => {
  const { formatOptions, getFormatOptionById } = useExportFormats();

  const handleOnChange = ({ id }: ExportFormatOption) => {
    props.dispatch({ type: 'SET_FORMAT', payload: id });
  };

  return (
    <Select<ExportFormatOption>
      name="format"
      label={props.label ?? 'Format'}
      hideLabel={false}
      id="export-format-select"
      options={formatOptions}
      value={getFormatOptionById(props.format)}
      onChange={handleOnChange}
      data-testid="export-select"
      stylesTheme="default"
      isDisabled={props.isLoading}
    />
  );
};
