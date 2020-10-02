import { Receipt } from '@material-ui/icons';
import { ToggleButton } from '@material-ui/lab';
import React from 'react';

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
