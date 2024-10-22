import { omit, values } from 'ramda';
import { Dispatch, useMemo } from 'react';
import { CitationExporterEvent } from '../CitationExporter.machine';
import { ExportFormat, exportFormats } from '../models';
import { Select } from '@/components/Select';
import { ExportApiFormatKey, isExportApiFormat } from '@/api/export/types';

export interface IFormatSelectProps {
  format: ExportApiFormatKey;
  dispatch: Dispatch<CitationExporterEvent>;
  isLoading?: boolean;
  label?: string;
}
export const FormatSelect = (props: IFormatSelectProps) => {
  const formats = useMemo(() => values(omit(['custom'], exportFormats)), []);

  const handleOnChange = ({ id }: ExportFormat) => {
    if (isExportApiFormat(id)) {
      props.dispatch({ type: 'SET_FORMAT', payload: id });
    }
  };

  return (
    <Select<ExportFormat>
      name="format"
      label={props.label ?? 'Format'}
      hideLabel={false}
      id="export-format-select"
      options={formats}
      value={exportFormats[props.format]}
      onChange={handleOnChange}
      data-testid="export-select"
      stylesTheme="default"
      isDisabled={props.isLoading}
    />
  );
};
