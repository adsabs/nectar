import { Select } from '@/components/Select';
import { ExportFormatOption, useExportFormats } from '@/lib/useExportFormats';

export interface IFormatSelectProps {
  format: string;
  onFormatChange: (format: string) => void;
  isLoading?: boolean;
  label?: string;
}

export const FormatSelect = (props: IFormatSelectProps) => {
  const { format, onFormatChange, isLoading, label } = props;
  const { formatOptionsNoCustom, getFormatOptionById } = useExportFormats();

  const handleOnChange = ({ id }: ExportFormatOption) => {
    onFormatChange(id);
  };

  return (
    <Select<ExportFormatOption>
      name="format"
      label={label ?? 'Format'}
      hideLabel={false}
      id="export-format-select"
      options={formatOptionsNoCustom}
      value={getFormatOptionById(format)}
      onChange={handleOnChange}
      data-testid="export-select"
      stylesTheme="default"
      isDisabled={isLoading}
    />
  );
};
