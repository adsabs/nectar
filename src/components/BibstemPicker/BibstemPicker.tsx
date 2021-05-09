import { TextInput } from '@components/TextInput';
import { XIcon } from '@heroicons/react/solid';
import { useCombobox, useMultipleSelection } from 'downshift';
import React, { HTMLAttributes } from 'react';
import { chainFrom } from 'transducist';
import { BibstemItem, bibstems } from './models';

export interface IBibstemPickerProps extends HTMLAttributes<HTMLDivElement> {
  initialSelectedItems?: string[];
}

export const BibstemPicker = ({}: IBibstemPickerProps): React.ReactElement => {
  const [inputValue, setInputValue] = React.useState('');
  const {
    getSelectedItemProps,
    getDropdownProps,
    addSelectedItem,
    removeSelectedItem,
    selectedItems,
  } = useMultipleSelection<BibstemItem>();

  const items = React.useMemo(() => searchBibstems(inputValue, selectedItems), [
    inputValue,
    selectedItems,
  ]);

  const {
    isOpen,
    getLabelProps,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
    selectItem,
  } = useCombobox<BibstemItem>({
    inputValue,
    items,
    onStateChange: ({ inputValue, type, selectedItem }) => {
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
    },
  });

  return (
    <div>
      <label
        {...getLabelProps()}
        className="block flex-1 text-gray-700 text-sm font-bold"
      >
        Publication(s)
      </label>
      <div className="flex space-x-2">
        {selectedItems.map(([bibstem, desc], index) => (
          <span
            key={`selected-item-${index}`}
            {...getSelectedItemProps({ selectedItem: [bibstem, desc], index })}
            onClick={() => removeSelectedItem([bibstem, desc])}
            className="flex p-1 border border-gray-300 focus:border-indigo-500 rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm"
          >
            <XIcon className="w-6 h-6" /> {bibstem}
          </span>
        ))}
      </div>
      <div {...getComboboxProps()} className="flex mt-1">
        <TextInput
          {...getInputProps(getDropdownProps({ preventKeyAction: isOpen }))}
        />
      </div>
      <ul {...getMenuProps()}>
        {isOpen &&
          items.map(([bibstem, desc], index) => (
            <li
              key={`${bibstem}${index}`}
              {...getItemProps({ item: [bibstem, desc], index })}
              style={
                highlightedIndex === index ? { backgroundColor: '#bde4ff' } : {}
              }
            >
              {bibstem} | {desc}
            </li>
          ))}
      </ul>
    </div>
  );
};

const searchBibstems = (
  searchString: string,
  itemsToOmit: BibstemItem[],
): BibstemItem[] => {
  const formatted = searchString.toLowerCase();
  const values = chainFrom(bibstems)
    .filter(
      ([bibstem, desc]) =>
        !itemsToOmit.includes([bibstem, desc]) &&
        bibstem.toLowerCase().startsWith(formatted),
    )
    .take(25)
    .toArray();
  return values;
};
