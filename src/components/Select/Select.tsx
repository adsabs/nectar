import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { CSSObject } from '@emotion/react';
import { ReactElement } from 'react';
import ReactSelect, { ControlProps, OptionProps, StylesConfig } from 'react-select';

export type SelectOption = {
  id: string;
  value: string;
  label: string;
  help?: string;
};
export interface ISelectProps {
  formLabel?: string;
  options: SelectOption[];
  value: SelectOption;
  onChange: (id: string) => void;
  styles: StylesConfig;
}

export const ThemeSelectorStyle: StylesConfig<SelectOption> = {
  control: (provided: CSSObject, state: ControlProps) => ({
    ...provided,
    height: '2em',
    borderRadius: '2px',
    borderColor: 'var(--chakra-colors-gray-100)',
    backgroundColor: 'var(--chakra-colors-gray-900)',
    outline: 'none',
    boxShadow: state.isFocused ? 'var(--chakra-shadows-outline)' : 'none',
  }),
  indicatorSeparator: () => ({
    isDisabled: true,
  }),
  singleValue: (provided: CSSObject) => ({
    ...provided,
    color: 'var(--chakra-colors-gray-100)',
  }),
  container: (provided: CSSObject) => ({
    ...provided,
    zIndex: 10,
  }),
  option: (provided: CSSObject, state: OptionProps) => ({
    ...provided,
    backgroundColor: state.isFocused ? 'var(--chakra-colors-gray-100)' : 'transparent',
    color: 'var(--chakra-colors-gray-700)',
  }),
};

export const SortSelectorStyle: StylesConfig = {
  control: (provided: CSSObject) => ({
    ...provided,
    height: '2.6em',
    borderRadius: '2px 0 0 2px',
    borderRightWidth: '0',
  }),
  indicatorSeparator: () => ({
    isDisabled: true,
  }),
  option: (provided: CSSObject, state: OptionProps) => ({
    ...provided,
    backgroundColor: state.isFocused ? 'var(--chakra-colors-gray-100)' : 'transparent',
    color: 'var(--chakra-colors-gray-700)',
  }),
};

export const DefaultSelectorStyle: StylesConfig = {
  control: (provided: CSSObject) => ({
    ...provided,
    height: '2.85em',
    borderRadius: '2px',
  }),
  indicatorSeparator: () => ({
    isDisabled: true,
  }),
  option: (provided: CSSObject, state: OptionProps) => ({
    ...provided,
    backgroundColor: state.isFocused ? 'var(--chakra-colors-gray-100)' : 'transparent',
    color: 'var(--chakra-colors-gray-700)',
  }),
};

export const Select = ({ formLabel, options, value: selected, onChange, styles }: ISelectProps): ReactElement => {
  const handleOnOptionSelected = (option: SelectOption) => {
    onChange(option.id);
  };

  return (
    <FormControl>
      {formLabel && <FormLabel>{formLabel}</FormLabel>}
      <ReactSelect
        value={selected}
        options={options}
        isSearchable={false}
        styles={styles}
        onChange={handleOnOptionSelected}
      />
    </FormControl>
  );
};
