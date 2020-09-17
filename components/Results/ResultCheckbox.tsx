import { Checkbox, FormControlLabel } from '@material-ui/core';
import React from 'react';

const ResultCheckbox: React.FC<IResultCheckboxProps> = ({ label, id }) => {
  const [checked, setChecked] = React.useState(false);

  const handleChecked = (e: React.FormEvent<HTMLInputElement>) => {
    const isChecked = e.currentTarget.checked;
    setChecked(isChecked);
  };

  return (
    <FormControlLabel
      label={label}
      labelPlacement="start"
      control={
        <Checkbox
          disabled={!process.browser}
          checked={checked}
          onChange={handleChecked}
          inputProps={{ 'aria-label': 'select' }}
        />
      }
    />
  );
};

export interface IResultCheckboxProps {
  label: React.ReactNode;
  id: string;
}

export default ResultCheckbox;
