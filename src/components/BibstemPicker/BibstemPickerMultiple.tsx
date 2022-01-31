import { TextInput } from '@components/TextInput';
import { XIcon } from '@heroicons/react/solid';
import { useCombobox, UseComboboxStateChange, useMultipleSelection } from 'downshift';
import dynamic from 'next/dynamic';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import type { IBibstemMenuProps } from './BibstemMenu';

const ITEM_DELIMITER = '$$';

const BibstemMenu = dynamic(
  () =>
    // eslint-disable-next-line
    (import('./BibstemMenu') as any).then((module) => module.BibstemMenu),
  {
    loading: () => (
      <ul className="relative">
        <li>loading...</li>
      </ul>
    ),
    ssr: false,
  },
) as (props: IBibstemMenuProps) => ReactElement;

export interface IBibstemPickerMultipleProps {
  initialSelectedItems?: string[];
  onChange?: (items: string[]) => void;
  name?: string;
}

export const BibstemPickerMultiple = ({
  onChange,
  name = 'bibstems',
  initialSelectedItems = [],
}: IBibstemPickerMultipleProps): ReactElement => {
  const [inputValue, setInputValue] = useState('');
  const { getSelectedItemProps, getDropdownProps, addSelectedItem, removeSelectedItem, selectedItems } =
    useMultipleSelection<string>({
      initialSelectedItems,
    });

  // trigger onChange, if necessary to parent component
  useEffect(() => {
    if (typeof onChange === 'function') {
      onChange(selectedItems.map((item) => item.split(ITEM_DELIMITER)[0]));
    }
  }, [onChange, selectedItems]);

  // clear input value and set selected item on blur
  const onComboboxStateChange = ({ inputValue, type, selectedItem }: UseComboboxStateChange<string>) => {
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

  const hiddenInput = useMemo(() => {
    const value = selectedItems.map((item) => item.split(ITEM_DELIMITER)[0]).join(',');
    return <input type="hidden" name={name} value={value} />;
  }, [selectedItems]);

  const [items, setItems] = useState<string[]>([]);
  const handleItemsChange = (updatedItems: string[]) => setItems(updatedItems);

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

  const renderPills = () => (
    <div className="grid gap-2 grid-flow-row grid-cols-4 md:grid-cols-8">
      {selectedItems.map((item, index) => {
        const bibstem = item.split(ITEM_DELIMITER)[0];
        return (
          <span
            key={`selected-item-${index}`}
            {...getSelectedItemProps({ selectedItem: item, index })}
            className="inline-flex items-center px-0.5 py-0.5 text-indigo-700 text-xs font-medium bg-indigo-100 rounded-full"
          >
            <button
              type="button"
              onClick={() => removeSelectedItem(item)}
              className="inline-flex flex-shrink-0 items-center justify-center w-4 h-4 text-indigo-400 hover:text-indigo-500 focus:text-white hover:bg-indigo-200 focus:bg-indigo-500 rounded-full focus:outline-none"
            >
              <span className="sr-only">Remove {bibstem}</span>
              <XIcon className="w-3 h-3" />
            </button>
            {bibstem}
          </span>
        );
      })}
    </div>
  );

  return (
    <div>
      <label {...getLabelProps()} className="block flex-1 text-gray-700 text-sm font-bold">
        Publication(s)
      </label>

      {renderPills()}

      <div {...getComboboxProps()} className="flex mt-1">
        <TextInput {...getInputProps(getDropdownProps({ preventKeyAction: isOpen }))} />
        {hiddenInput}
      </div>
      <div {...getMenuProps()} className="relative">
        {isOpen && (
          <BibstemMenu
            onItemsChange={handleItemsChange}
            highlightedIndex={highlightedIndex}
            getItemProps={getItemProps}
            inputValue={inputValue}
            selectedItems={selectedItems}
          />
        )}
      </div>
    </div>
  );
};
