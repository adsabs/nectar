import { TextInput } from '@components/TextInput';
import { useCombobox } from 'downshift';
import dynamic from 'next/dynamic';
import React from 'react';
import type { IBibstemMenuProps } from './BibstemMenu';
import { ITEM_DELIMITER } from './models';
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
) as (props: IBibstemMenuProps) => React.ReactElement;

export interface IBibstemPickerSingleProps {
  initialSelectedItem?: string;
  onChange?: (item: string) => void;
  name?: string;
}

export const BibstemPickerSingle = ({
  onChange,
  name,
  initialSelectedItem,
}: IBibstemPickerSingleProps): React.ReactElement => {
  // store items locally, since this will be updated dynamically by the menu
  const [items, setItems] = React.useState<string[]>([]);
  const handleItemsChange = (updatedItems: string[]) => setItems(updatedItems);

  const {
    isOpen,
    getLabelProps,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
    selectedItem,
    inputValue,
  } = useCombobox<string>({
    items,
    initialSelectedItem,
    itemToString: (item) => item.split(ITEM_DELIMITER)[0],
  });

  // instead of overloading the prop, just convert to array
  const selectedItems = React.useMemo(() => [selectedItem], [selectedItem]);

  // trigger onChange, if necessary to parent component
  React.useEffect(() => {
    if (typeof onChange === 'function') {
      onChange(selectedItem.split(ITEM_DELIMITER)[0]);
    }
  }, [onChange, selectedItem]);

  return (
    <div>
      <label {...getLabelProps()} className="block flex-1 text-gray-700 text-sm font-bold">
        Publication(s)
      </label>

      <div {...getComboboxProps()} className="flex mt-1">
        <TextInput {...getInputProps()} />

        {/* Create hidden input to hold the value (this is for ssr) */}
        <input type="hidden" name={name} value={selectedItem} />
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

BibstemPickerSingle.defaultProps = {
  name: 'Bibstem',
} as Partial<IBibstemPickerSingleProps>;
