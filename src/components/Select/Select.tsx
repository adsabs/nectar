import { FormControl, FormLabel } from '@chakra-ui/react';
import { ForwardedRef, forwardRef, ReactElement, ReactNode, useMemo } from 'react';
import { default as ReactSelect, GroupBase, Props, StylesConfig } from 'react-select';

export type SelectOption<V = unknown> = {
  id: V;
  value: string;
  label: string;
  help?: string;
};

export interface ISelectProps<
  Option = SelectOption,
  isMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
> extends Partial<Props<Option, isMulti, Group>> {
  label: ReactNode;
  hideLabel?: boolean;
  stylesTheme?: 'theme' | 'sort' | 'default' | 'default.sm';
  id: string;
  'data-testid'?:string;
}

const SelectImpl = <
  Option = SelectOption,
  isMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(
  props: ISelectProps<Option, isMulti, Group>,
  ref: ForwardedRef<never>,
): ReactElement => {
  const { hideLabel = true, label, stylesTheme, id, ...selectProps } = props;

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
        aria-label={typeof label === 'string' ? label : 'select'}
        id={id}
        instanceId={id}
        ref={ref}
        {...selectProps}
        styles={themes[stylesTheme]}
      />
      <input type="hidden" value={(selectProps?.value as SelectOption)?.value} data-testid={selectProps['data-testid']} />
    </FormControl>
  );
};

export const Select = forwardRef(SelectImpl) as <
  Option = SelectOption,
  isMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(
  props: ISelectProps<Option, isMulti, Group> & { ref?: ForwardedRef<never> },
) => ReactElement;
