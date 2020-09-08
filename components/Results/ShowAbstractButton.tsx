import React from 'react';
import { ToggleButton } from '@material-ui/lab';
import { Receipt } from '@material-ui/icons';

const ShowAbstractButton: React.FC<IShowAbstractButtonProps> = ({
  selected,
  onChange,
}) => {
  return (
    <ToggleButton
      value="check"
      selected={selected}
      onChange={() => {
        onChange(!selected);
      }}
      size="small"
    >
      <Receipt />
    </ToggleButton>
  );
};

export interface IShowAbstractButtonProps {
  selected: boolean;
  onChange(selected: boolean): void;
}

export default ShowAbstractButton;
