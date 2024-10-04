import { useColorModeColorVars } from '@/lib/useColorModeColors';
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
  'data-testid'?: string;
}

function SelectImpl<
  Option = SelectOption,
  isMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(props: ISelectProps<Option, isMulti, Group>, ref: ForwardedRef<never>): ReactElement {
  const { hideLabel = true, label, stylesTheme, id, ...selectProps } = props;

  const colors = useColorModeColorVars();

  const themes: Record<string, StylesConfig<Option, isMulti, Group>> = useMemo(
    () =>
      ({
        theme: {
          control: (provided, state) => ({
            ...provided,
            height: '2em',
            borderRadius: '2px',
            borderColor: colors.border,
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
            borderColor: colors.border,
          }),
          option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isFocused ? colors.highlightBackground : 'transparent',
            color: state.isFocused ? colors.highlightForeground : colors.text,
          }),
          menu: (provided) => ({
            ...provided,
            backgroundColor: colors.background,
            boxShadow: `0 0 0 1px ${colors.border}`,
            zIndex: 10,
          }),
        },
        sort: {
          control: (provided) => ({
            ...provided,
            height: '2.6em',
            borderRadius: '2px 0 0 2px',
            borderRightWidth: '0',
            borderColor: colors.border,
            backgroundColor: colors.background,
          }),
          // the text in control
          singleValue: (provided) => ({
            ...provided,
            color: colors.text,
          }),
          indicatorSeparator: () => ({
            isDisabled: true,
          }),
          option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isFocused ? colors.highlightBackground : 'transparent',
            color: state.isFocused ? colors.highlightForeground : colors.text,
          }),
          menu: (provided) => ({
            ...provided,
            backgroundColor: colors.background,
            boxShadow: `0 0 0 1px ${colors.border}`,
            zIndex: 10,
          }),
        },
        default: {
          control: (provided) => ({
            ...provided,
            height: '2.85em',
            borderRadius: '2px',
            borderColor: colors.border,
            backgroundColor: 'transparent',
          }),
          singleValue: (provided) => ({
            ...provided,
            color: colors.text,
          }),
          indicatorSeparator: () => ({
            isDisabled: true,
          }),
          option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isFocused ? colors.highlightBackground : 'transparent',
            color: state.isFocused ? colors.highlightForeground : colors.text,
          }),
          menu: (provided) => ({
            ...provided,
            backgroundColor: colors.background,
            boxShadow: `0 0 0 1px ${colors.border}`,
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
            borderColor: colors.border,
            backgroundColor: 'transparent',
          }),
          singleValue: (provided) => ({
            ...provided,
            color: colors.text,
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
            backgroundColor: state.isFocused ? colors.highlightBackground : 'transparent',
            color: state.isFocused ? colors.highlightForeground : colors.text,
            fontSize: '0.8em',
          }),
          menu: (provided) => ({
            ...provided,
            backgroundColor: colors.background,
            boxShadow: `0 0 0 1px ${colors.border}`,
            zIndex: 10,
          }),
        },
      } as const),
    [colors],
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
      <input
        type="hidden"
        value={(selectProps?.value as SelectOption)?.value}
        data-testid={selectProps['data-testid']}
      />
    </FormControl>
  );
}

export const Select = forwardRef(SelectImpl) as <
  Option = SelectOption,
  isMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(
  props: ISelectProps<Option, isMulti, Group> & { ref?: ForwardedRef<never> },
) => ReactElement;

export const createOptions =
  <T,>(labelKey: keyof T | ((item: T) => ReactNode), valueKey: keyof T | ((item: T) => ReactNode)) =>
  (items: T[]): Array<SelectOption<T>> => {
    return items.map(
      (item) =>
        ({
          id: item,
          label: typeof labelKey === 'function' ? labelKey(item) : (item[labelKey] as string),
          value: typeof valueKey === 'function' ? valueKey(item) : (item[valueKey] as string),
        } as SelectOption<T>),
    );
  };
