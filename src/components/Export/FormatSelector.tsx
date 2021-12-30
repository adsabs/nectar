import PT from 'prop-types';
import { ReactElement } from 'react';
import { exportFormats } from './constants';
import { ExportState } from './types';
import { Select } from '@components';

interface IFormatSelectorProps {
  format: ExportState['format'];
  onFormatChange: (format: ExportState['format']) => void;
}

const propTypes = {
  format: PT.string.isRequired,
  onFormatChange: PT.func.isRequired,
};

export const FormatSelector = ({ format, onFormatChange }: IFormatSelectorProps): ReactElement => {
  return (
    <Select
      formLabel="Export Format"
      options={Object.values(exportFormats)}
      defaultOption={format}
      onOptionSelected={onFormatChange}
    />
  );
};

FormatSelector.propTypes = propTypes;
