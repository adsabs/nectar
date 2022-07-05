import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { ReactElement, ReactNode, useMemo } from 'react';
import { default as ReactSelect, GroupBase, Props, StylesConfig } from 'react-select';
import { v4 as uuid } from 'uuid';

export type SelectOption<V = unknown> = {
  id: V;
  value: string;
  label: string;
  help?: string;
};
export interface ISelectProps<
  Option extends SelectOption = SelectOption,
  isMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
> extends Props<Option, isMulti, Group> {
  label: ReactNode;
  hideLabel?: boolean;
  stylesTheme?: 'theme' | 'sort' | 'default' | 'default.sm';
  id?: string;
}

export const Select = <
  Option extends SelectOption = SelectOption,
  isMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(
  props: ISelectProps<Option, isMulti, Group>,
): ReactElement => {
  const { hideLabel = true, label, stylesTheme, id, ...selectProps } = props;

  const selectId = id ?? `select-${uuid()}`;

  const themes: Record<string, StylesConfig<Option, isMulti, Group>> = useMemo(
    () =>
      ({
        theme: {
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
          menu: (provided) => ({
            ...provided,
            zIndex: 10,
          }),
        },
        sort: {
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
          menu: (provided) => ({
            ...provided,
            zIndex: 10,
          }),
        },
        default: {
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
          menu: (provided) => ({
            ...provided,
            zIndex: 10,
          }),
        },
        'default.sm': {
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
          menu: (provided) => ({
            ...provided,
            zIndex: 10,
          }),
        },
      } as const),
    [],
  );

  return (
    <FormControl>
      {!hideLabel && (typeof label === 'string' ? <FormLabel htmlFor={id}>{label}</FormLabel> : label)}
      <ReactSelect
        isSearchable={false}
        aria-label={typeof label === 'string' ? label : ''}
        id={selectId}
        {...selectProps}
        styles={themes[stylesTheme]}
      />
    </FormControl>
  );
};
