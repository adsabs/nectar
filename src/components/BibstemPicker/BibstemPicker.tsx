import { HStack, Text, VisuallyHidden } from '@chakra-ui/react';

import { IBibstemOption } from '@/types';
import axios from 'axios';
import {
  always,
  any,
  assoc,
  curry,
  find,
  head,
  ifElse,
  init,
  join,
  lens,
  map,
  omit,
  pick,
  pipe,
  prop,
  propEq,
  propOr,
  reject,
  set,
  T,
  tail,
  test,
  trim,
  when,
} from 'ramda';
import { ForwardedRef, forwardRef, HTMLProps, ReactElement, Reducer, useEffect, useReducer, useRef } from 'react';
import {
  ActionMeta,
  components,
  GroupBase,
  InputActionMeta,
  MultiValue,
  MultiValueProps,
  OptionProps,
  OptionsOrGroups,
} from 'react-select';
import AsyncCreatableSelect from 'react-select/async-creatable';
import Select from 'react-select/dist/declarations/src/Select';
import defaultBibstems from './defaultBibstems.json';
import { useColorModeColorVars } from '@/lib/useColorModeColors';
import { logger } from '@/logger';

export interface IBibstemPickerProps extends Omit<HTMLProps<HTMLInputElement>, 'onChange'> {
  isMultiple?: boolean;
  onChange?: (value: string) => void;
}

// helper utilities
const hasPrefix = test(/^-/);
const removePrefixIfPresent = when<string, string>(hasPrefix, tail);
const getPrefixIfPresent = ifElse<[string], string, string>(hasPrefix, head, always(''));
const cleanInput = pipe(trim, removePrefixIfPresent);
const optionToString = (option: IBibstemOption) => `${option?.prefix ?? ''}${option.value}`;
const prefixLens = lens<IBibstemOption, string>(propOr('prefix', ''), assoc('prefix'));

// adds/updates `prefix` prop on object
const applyPrefix = curry((prefix: string, option: IBibstemOption) => set(prefixLens, prefix)(option));
const formatBibstemOptions = pipe<[IBibstemOption[]], string[], string>(map(optionToString), join(','));
const isOptionSelected = curry((selected: IBibstemOption[], option: IBibstemOption) =>
  any(propEq('value', prop('value', option)), selected),
);
const removeOption = curry((selected: IBibstemOption[], option: IBibstemOption) =>
  reject(propEq('value', prop('value', option)), selected),
);
const isOptionDisabled = (option: IBibstemOption): boolean => propOr(false, 'isDisabled', option);

/**
 * Simple pill with prefix in front of data value
 */
const getPill =
  (selected: IBibstemOption[]) =>
  // eslint-disable-next-line react/display-name
  ({ children, ...props }: MultiValueProps<IBibstemOption>) => {
    const match = find<IBibstemOption>(propEq('value', props.data.value), selected);
    return (
      <components.MultiValue {...props}>
        <span data-testid="pill">
          {match?.prefix}
          {props.data.value}
        </span>
      </components.MultiValue>
    );
  };

/**
 * Custom option style
 */
const Option = ({ children, ...props }: OptionProps<IBibstemOption>) => {
  if (props.data.type === 'error') {
    return (
      <components.Option {...props} innerProps={{ ...props.innerProps, style: { padding: 'none' } }}>
        <Text fontWeight="bold" color="red.300" data-testid="option">
          {props.data.value}
        </Text>
      </components.Option>
    );
  }
  return (
    <components.Option {...props}>
      <HStack justifyContent="space-between" data-testid="option">
        <Text fontWeight="bold">{props.data.value}</Text>
        <Text fontWeight="light">{props.data.label}</Text>
      </HStack>
    </components.Option>
  );
};

interface IBibstemPickerState {
  hiddenValue: string;
  inputValue: string;
  prefix: string;
  selected: IBibstemOption[];
  isMultiple: boolean;
}
const reducer: Reducer<
  IBibstemPickerState,
  | { type: 'update_input'; payload: string; meta: InputActionMeta }
  | {
      type: 'update_selected';
      payload: IBibstemOption | MultiValue<IBibstemOption>;
      meta: ActionMeta<IBibstemOption>;
    }
  | { type: 'reset' }
> = (state, action) => {
  // for normal typing, check for prefix, otherwise just update value; also clear error
  if (action.type === 'update_input' && action.meta.action === 'input-change') {
    return {
      ...state,
      inputValue: action.payload,
      prefix: getPrefixIfPresent(action.payload),
    };
  } else if (action.type === 'update_input') {
    return { ...state, inputValue: action.payload };
  }

  if (action.type === 'update_selected') {
    switch (action.meta.action) {
      case 'clear':
        return { ...state, selected: [], hiddenValue: '' };

      // if user backspaces and removes entry, just pop from our list
      case 'pop-value': {
        const selected = init(state.selected);
        return {
          ...state,
          selected,
          hiddenValue: formatBibstemOptions(selected),
          prefix: '',
        };
      }

      // find and remove the option from our list
      case 'remove-value':
      case 'deselect-option': {
        const selected = state.isMultiple
          ? removeOption(state.selected, action.meta.removedValue)
          : ([action.payload] as IBibstemOption[]);

        return {
          ...state,
          selected,
          hiddenValue: formatBibstemOptions(selected),
          prefix: '',
        };
      }

      // push on new entry and apply prefix (if necessary)
      case 'select-option': {
        const selected = state.isMultiple
          ? [...state.selected, applyPrefix(state.prefix, action.meta.option)]
          : ([action.payload] as IBibstemOption[]);
        return {
          ...state,
          selected,
          hiddenValue: formatBibstemOptions(selected),
          prefix: '',
        };
      }

      // push new entry, but don't check for prefixes on custom entries
      case 'create-option': {
        const selected = state.isMultiple
          ? [...state.selected, action.meta.option]
          : ([action.payload] as IBibstemOption[]);

        return {
          ...state,
          selected,
          hiddenValue: formatBibstemOptions(selected),
          prefix: '',
        };
      }
    }
  }

  if (action.type === 'reset') {
    return {
      ...state,
      selected: [],
      hiddenValue: '',
      prefix: '',
      inputValue: '',
    };
  }

  return state;
};

const BibstemPickerImpl = (props: IBibstemPickerProps, ref: ForwardedRef<never>): ReactElement => {
  const { isMultiple, onChange, ...inputProps } = props;
  const selectRef = useRef<Select<IBibstemOption, boolean, GroupBase<IBibstemOption>>>(null);
  const [state, dispatch] = useReducer(reducer, {
    hiddenValue: '',
    inputValue: '',
    selected: [],
    prefix: '',
    isMultiple,
  });

  const colors = useColorModeColorVars();

  const fetchOptions = async (value: string): Promise<OptionsOrGroups<IBibstemOption, GroupBase<IBibstemOption>>> => {
    const valueToFetch = cleanInput(value);
    if (valueToFetch.length === 0) {
      return [];
    }

    try {
      const { data } = await axios.get<IBibstemOption[]>(`api/bibstems/${valueToFetch}`);
      return data;
    } catch (err) {
      logger.error({ err }, 'Error fetching bibstems from api');
      // send back a single "error" item with a message
      return [
        {
          value: `Cannot fetch items for search "${value}"`,
          label: [],
          type: 'error',
          isDisabled: true,
        },
      ];
    }
  };

  // trigger a call to external `onChange` if one was passed in
  useEffect(() => {
    if (typeof onChange === 'function') {
      onChange(state.hiddenValue);
    }
  }, [onChange, state.hiddenValue]);

  useEffect(() => {
    // respect outside props in case a reset is requested
    if (inputProps?.value === '') {
      dispatch({ type: 'reset' });
      selectRef.current.clearValue();
    }
  }, [inputProps.value]);

  return (
    <>
      {/* hidden input to make sure value is seen on form properly */}
      <VisuallyHidden>
        <input
          aria-hidden
          data-testid="hidden-input"
          type="text"
          name="bibstems"
          defaultValue={state.hiddenValue}
          {...omit(['value'], inputProps)}
          onFocus={() => selectRef.current.focus()}
          ref={ref}
        />
      </VisuallyHidden>
      <AsyncCreatableSelect<IBibstemOption, typeof isMultiple>
        instanceId="bibstem-picker"
        aria-label="bibstem picker"
        loadOptions={fetchOptions}
        // only look at the incoming meta value to decide what to update
        onChange={(payload, meta) => dispatch({ type: 'update_selected', payload, meta })}
        onInputChange={(payload, meta) => dispatch({ type: 'update_input', payload, meta })}
        // override option selected logic to check our state instead
        isOptionSelected={isOptionSelected(state.selected)}
        isOptionDisabled={isOptionDisabled}
        inputValue={state.inputValue}
        isMulti={isMultiple}
        cacheOptions
        defaultOptions={defaultBibstems}
        filterOption={T}
        isSearchable
        placeholder="Start typing to search journal database"
        formatCreateLabel={(value) => `Custom Journal? insert "${value}"`}
        components={{
          MultiValue: getPill(state.selected),
          Option,
        }}
        ref={selectRef}
        styles={{
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
            backgroundColor: state.isFocused ? colors.highlightBackground : colors.background,
            color: state.isFocused ? colors.highlightForeground : colors.text,
          }),
          menu: (provided) => ({
            ...provided,
            backgroundColor: colors.background,
            boxShadow: `0 0 0 1px ${colors.border}`,
            zIndex: 10,
          }),
          multiValueLabel: (provided) => ({
            ...provided,
            backgroundColor: colors.pill,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            color: colors.pillText,
          }),
          multiValueRemove: (provided) => ({
            ...provided,
            backgroundColor: colors.pill,
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            ':hover': { backgroundColor: colors.pill },
            color: colors.pillText,
          }),
        }}
        {...pick(['onBlur'], inputProps)}
      />
    </>
  );
};

/**
 * Bibstem (Publication) picker
 *
 * Supports prefixes `+` and `-`
 *
 * @example
 * `+ApJ` or `-ApJ`
 */
export const BibstemPicker = forwardRef(BibstemPickerImpl);
