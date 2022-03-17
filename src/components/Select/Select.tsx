import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { ReactElement } from 'react';
import ReactSelect, { MenuPlacement, StylesConfig } from 'react-select';

export type SelectOption = {
  id: string;
  value: string;
  label: string;
  help?: string;
};
export interface ISelectProps<T> {
  formLabel?: string;
  ariaLabel?: string;
  options: SelectOption[];
  value: SelectOption;
  onChange: (id: T) => void;
  styles: StylesConfig<SelectOption>;
  menuPlacement?: MenuPlacement;
}

export const ThemeSelectorStyle: StylesConfig<SelectOption> = {
  control: (provided, state) => ({
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
  singleValue: (provided) => ({
    ...provided,
    color: 'var(--chakra-colors-gray-100)',
  }),
  container: (provided) => ({
    ...provided,
    zIndex: 10,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? 'var(--chakra-colors-gray-100)' : 'transparent',
    color: 'var(--chakra-colors-gray-700)',
  }),
};

export const SortSelectorStyle: StylesConfig<SelectOption> = {
  control: (provided) => ({
    ...provided,
    height: '2.6em',
    borderRadius: '2px 0 0 2px',
    borderRightWidth: '0',
  }),
  indicatorSeparator: () => ({
    isDisabled: true,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? 'var(--chakra-colors-gray-100)' : 'transparent',
    color: 'var(--chakra-colors-gray-700)',
  }),
};

export const DefaultSelectorStyle: StylesConfig<SelectOption> = {
  control: (provided) => ({
    ...provided,
    height: '2.85em',
    borderRadius: '2px',
  }),
  indicatorSeparator: () => ({
    isDisabled: true,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? 'var(--chakra-colors-gray-100)' : 'transparent',
    color: 'var(--chakra-colors-gray-700)',
  }),
};

export const DefaultSelectorStyleSM: StylesConfig<SelectOption> = {
  container: (provided) => ({
    ...provided,
    minHeight: '28px',
  }),
  control: (provided) => ({
    ...provided,
    minHeight: '28px',
    borderRadius: '2px',
    fontSize: '0.8em',
  }),

  indicatorsContainer: (provided) => ({
    ...provided,
    height: '28px',
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    padding: '5px',
    width: '28px',
  }),
  indicatorSeparator: () => ({
    isDisabled: true,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? 'var(--chakra-colors-gray-100)' : 'transparent',
    color: 'var(--chakra-colors-gray-700)',
    fontSize: '0.8em',
  }),
};

export const Select = <T extends string>({
  formLabel,
  ariaLabel,
  options,
  value: selected,
  onChange,
  styles,
  menuPlacement = 'auto',
}: ISelectProps<T>): ReactElement => {
  const handleOnOptionSelected = (option: SelectOption) => {
    onChange(option.id as T);
  };

  return (
    <FormControl>
      {formLabel && <FormLabel>{formLabel}</FormLabel>}
      <ReactSelect<SelectOption>
        value={selected}
        options={options}
        isSearchable={false}
        styles={styles}
        onChange={handleOnOptionSelected}
        aria-label={ariaLabel}
        menuPlacement={menuPlacement}
      />
    </FormControl>
  );
};
