import PT from 'prop-types';
import { ReactElement } from 'react';
import { exportFormats } from './constants';
import { ExportState } from './types';
import { Select, DefaultSelectorStyle } from '@components';

interface IFormatSelectorProps {
  format: ExportState['format'];
  onFormatChange: (format: ExportState['format']) => void;
}

const propTypes = {
  format: PT.string.isRequired,
  onFormatChange: PT.func.isRequired,
};

export const FormatSelector = ({ format, onFormatChange }: IFormatSelectorProps): ReactElement => {
  const options = Object.values(exportFormats).map((format) => ({
    id: format.id,
    value: format.id,
    label: format.label,
    help: format.help,
  }));

  const selected = options.find((f) => f.id === format);
  return (
    <Select
      formLabel="Export Format"
      options={options}
      value={selected}
      onChange={onFormatChange}
      styles={DefaultSelectorStyle}
    />
  );
};

FormatSelector.propTypes = propTypes;
