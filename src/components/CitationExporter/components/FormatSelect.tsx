import { FormControl, FormLabel, Select as BasicSelect } from '@chakra-ui/react';
import { Select } from '@components';
import { Sender } from '@xstate/react/lib/types';
import { ExportApiFormatKey, isExportApiFormat } from '@_api/export';
import { omit, values } from 'ramda';
import { ReactElement, useMemo } from 'react';
import { CitationExporterEvent } from '../CitationExporter.machine';
import { ExportFormat, exportFormats } from '../models';

export interface IFormatSelectProps {
  format: ExportApiFormatKey;
  dispatch: Sender<CitationExporterEvent>;
  isLoading?: boolean;
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
      label="Format"
      hideLabel={false}
      id="export-format-select"
      options={formats}
      value={exportFormats[props.format]}
      onChange={handleOnChange}
      data-testid="export-select"
      stylesTheme="default"
    />
  );
};

const Static = ({ format }: Pick<IFormatSelectProps, 'format'>): ReactElement => {
  const formats = values(exportFormats)
    .filter((f) => f.id !== ExportApiFormatKey.custom)
    .map((fmt) => (
      <option key={fmt.id} value={fmt.value}>
        {fmt.label}
      </option>
    ));
  return (
    <FormControl>
      <FormLabel htmlFor="export-format-select">Format</FormLabel>
      <BasicSelect name="format" id="export-format-select" data-testid="export-select" defaultValue={format}>
        {formats}
      </BasicSelect>
    </FormControl>
  );
};

FormatSelect.Static = Static;
