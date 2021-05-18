import { TextInput } from '@components/TextInput';
import { XIcon } from '@heroicons/react/solid';
import {
  useCombobox,
  UseComboboxStateChange,
  useMultipleSelection,
} from 'downshift';
import React from 'react';
import { chainFrom } from 'transducist';
import { bibstems } from './models';

export interface IBibstemPickerProps {
  initialSelectedItems?: string[];
  onChange?: (items: string[]) => void;
}

export const BibstemPicker = ({
  onChange,
  initialSelectedItems = [],
}: IBibstemPickerProps): React.ReactElement => {
  const [inputValue, setInputValue] = React.useState('');
  const {
    getSelectedItemProps,
    getDropdownProps,
    addSelectedItem,
    removeSelectedItem,
    selectedItems,
  } = useMultipleSelection<string>({
    initialSelectedItems,
  });

  // trigger onChange, if necessary to parent component
  React.useEffect(() => {
    if (typeof onChange === 'function') {
      onChange(selectedItems);
    }
  }, [onChange, selectedItems]);

  // memoize the items filtering (heavy operation)
  const items = React.useMemo(() => searchBibstems(inputValue, selectedItems), [
    inputValue,
    selectedItems,
  ]);

  // clear input value and set selected item on blur
  const onComboboxStateChange = ({
    inputValue,
    type,
    selectedItem,
  }: UseComboboxStateChange<string>) => {
    switch (type) {
      case useCombobox.stateChangeTypes.InputChange:
        setInputValue(inputValue);
        break;
      case useCombobox.stateChangeTypes.InputKeyDownEnter:
      case useCombobox.stateChangeTypes.ItemClick:
      case useCombobox.stateChangeTypes.InputBlur:
        if (selectedItem) {
          setInputValue('');
          addSelectedItem(selectedItem);
          selectItem(null);
        }

        break;
      default:
        break;
    }
  };

  const {
    isOpen,
    getLabelProps,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
    selectItem,
  } = useCombobox<string>({
    inputValue,
    items,
    onStateChange: onComboboxStateChange,
  });

  return (
    <div>
      <label
        {...getLabelProps()}
        className="block flex-1 text-gray-700 text-sm font-bold"
      >
        Publication(s)
      </label>
      <div className="grid gap-2 grid-flow-row grid-cols-4 md:grid-cols-12">
        {selectedItems.map((item, index) => (
          <div
            key={`selected-item-${index}`}
            {...getSelectedItemProps({ selectedItem: item, index })}
            onClick={() => removeSelectedItem(item)}
            className="flex col-span-1 items-center p-1 whitespace-nowrap border border-gray-300 focus:border-indigo-500 rounded-md shadow-sm cursor-pointer focus:ring-indigo-500 sm:text-sm"
          >
            <XIcon className="hidden w-4 h-4 md:block" /> {item.split('$$')[0]}
          </div>
        ))}
      </div>
      <div {...getComboboxProps()} className="flex mt-1">
        <TextInput
          {...getInputProps(getDropdownProps({ preventKeyAction: isOpen }))}
        />
      </div>
      <ul {...getMenuProps()}>
        {isOpen &&
          items.map((item, index) => {
            const [bibstem, description] = item.split('$$');
            return (
              <li
                key={`${item}${index}`}
                {...getItemProps({ item, index })}
                style={
                  highlightedIndex === index
                    ? { backgroundColor: '#bde4ff' }
                    : {}
                }
                className="divide-y-0"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-lg">{bibstem}</div>
                  <div className="text-gray-600 text-sm">{description}</div>
                </div>
              </li>
            );
          })}
      </ul>
    </div>
  );
};

/**
 * Filters the bibstems and returns a list of filtered items that start with the search string
 *
 * @param {string} searchString string to search bibstems
 * @param {string[]} itemsToOmit items to exclude from the search (e.g. already selected)
 * @return {*}  {string[]}
 */
const searchBibstems = (
  searchString: string,
  itemsToOmit: string[],
): string[] => {
  const formatted = searchString.toLowerCase();
  const values = chainFrom(bibstems)
    .filter(
      (bibstem) =>
        !itemsToOmit.includes(bibstem) &&
        bibstem.toLowerCase().startsWith(formatted),
    )
    .take(25)
    .toArray();
  return values;
};
