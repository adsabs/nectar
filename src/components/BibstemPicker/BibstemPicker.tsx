import { TextInput } from '@components/TextInput';
import { XIcon } from '@heroicons/react/solid';
import {
  useCombobox,
  UseComboboxStateChange,
  useMultipleSelection,
} from 'downshift';
import dynamic from 'next/dynamic';
import React from 'react';
import type { IBibstemMenuProps } from './BibstemMenu';
const BibstemMenu = dynamic(
  () =>
    // eslint-disable-next-line
    (import('./BibstemMenu') as any).then((module) => module.BibstemMenu),
  { loading: () => <li>loading...</li>, ssr: false },
) as (props: IBibstemMenuProps) => React.ReactElement;

export interface IBibstemPickerProps {
  initialSelectedItems?: string[];
  onChange?: (items: string[]) => void;
  name?: string;
}

export const BibstemPicker = ({
  onChange,
  name = 'bibstems',
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
      onChange(selectedItems.map((item) => item.split('$$')[0]));
    }
  }, [onChange, selectedItems]);

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

  const renderHiddenInput = () => {
    const value = selectedItems.map((item) => item.split('$$')[0]).join(',');
    return <input type="hidden" name={name} value={value} />;
  };

  const [items, setItems] = React.useState<string[]>([]);
  const handleItemsChange = (updatedItems) => setItems(updatedItems);

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
        {renderHiddenInput()}
      </div>
      <ul {...getMenuProps()}>
        {isOpen && (
          <BibstemMenu
            onItemsChange={handleItemsChange}
            highlightedIndex={highlightedIndex}
            getItemProps={getItemProps}
            inputValue={inputValue}
            selectedItems={selectedItems}
          />
        )}
      </ul>
    </div>
  );
};
