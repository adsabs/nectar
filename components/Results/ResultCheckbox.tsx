import React from 'react';
import { insert, remove, findIndex, equals } from 'ramda';
import { Checkbox } from '@material-ui/core';
import { useRecoilState } from 'recoil';
import { selectedDocsState } from '@recoil/atoms';

const ResultCheckbox: React.FC<{ id: string }> = ({ id }) => {
  const [selectedResults, setSelectedResults] = useRecoilState(
    selectedDocsState
  );
  const [checked, setChecked] = React.useState(false);

  const handleChecked = (e: React.FormEvent<HTMLInputElement>) => {
    const isChecked = e.currentTarget.checked;
    setSelectedResults(
      isChecked
        ? insert(0, id, selectedResults)
        : remove(findIndex(equals(id), selectedResults), 1, selectedResults)
    );

    setChecked(isChecked);
  };

  return (
    <Checkbox
      checked={checked}
      onChange={handleChecked}
      inputProps={{ 'aria-label': 'select' }}
    />
  );
};

export default ResultCheckbox;
