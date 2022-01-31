import { TextInput } from '@components/TextInput';
import { useCombobox } from 'downshift';
import dynamic from 'next/dynamic';
import { DetailedHTMLProps, InputHTMLAttributes, ReactElement, useMemo, useState } from 'react';
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

export interface IBibstemPickerSingleProps
  extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  initialSelectedItem?: string;
  onItemUpdate: (item: string) => void;
  name?: string;
}

export const BibstemPickerSingle = (props: IBibstemPickerSingleProps): ReactElement => {
  const { onItemUpdate, name, initialSelectedItem } = props;

  // store items locally, since this will be updated dynamically by the menu
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
    selectedItem,
    inputValue,
  } = useCombobox<string>({
    items,
    initialSelectedItem,
    onInputValueChange: ({ inputValue }) => {
      // update item if user clears input
      if (typeof onItemUpdate === 'function' && inputValue.length === 0) {
        onItemUpdate(inputValue);
      }
    },
    onSelectedItemChange: ({ inputValue }) => {
      if (typeof onItemUpdate === 'function') {
        onItemUpdate(inputValue);
      }
    },
    itemToString: (item) => item.split(ITEM_DELIMITER)[0],
  });

  // instead of overloading the prop, just convert to array
  const selectedItems = useMemo(() => [selectedItem], [selectedItem]);

  return (
    <>
      <label {...getLabelProps()} className="block flex-1 text-gray-700 text-sm font-bold">
        Publication
      </label>

      <div {...getComboboxProps()} className="flex mt-1">
        <TextInput name={name} {...getInputProps()} />
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
    </>
  );
};

BibstemPickerSingle.defaultProps = {
  name: 'Bibstem',
} as Partial<IBibstemPickerSingleProps>;
