import { Box, Flex, FormControl, FormHelperText, FormLabel } from '@chakra-ui/react';
import { TextInput } from '@components/TextInput';
import { useCombobox } from 'downshift';
import dynamic from 'next/dynamic';
import { DetailedHTMLProps, forwardRef, InputHTMLAttributes, ReactElement, useMemo, useState } from 'react';
import type { IBibstemMenuProps } from './BibstemMenu';

const ITEM_DELIMITER = '$$';

const BibstemMenu = dynamic<IBibstemMenuProps>(() => import('./BibstemMenu').then((module) => module.BibstemMenu), {
  loading: () => (
    <ul className="relative">
      <li>loading...</li>
    </ul>
  ),
  ssr: false,
});

export interface IBibstemPickerSingleProps
  extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  initialSelectedItem?: string;
  onItemUpdate?: (item: string) => void;
  name?: string;
}

export const BibstemPickerSingle = forwardRef<HTMLInputElement, IBibstemPickerSingleProps>(
  (props, inputRef): ReactElement => {
    const { onItemUpdate, name, initialSelectedItem, ...inputProps } = props;

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
      <FormControl>
        <FormLabel {...getLabelProps()}>Publication</FormLabel>
        <Flex {...getComboboxProps()}>
          <TextInput
            name={name}
            placeholder="Publication"
            id={name}
            {...getInputProps({ ref: inputRef, ...inputProps })}
          />
        </Flex>
        {!isOpen && <FormHelperText>Start typing to search database</FormHelperText>}
        <Box {...getMenuProps()} position="relative">
          {isOpen && (
            <BibstemMenu
              onItemsChange={handleItemsChange}
              highlightedIndex={highlightedIndex}
              getItemProps={getItemProps}
              inputValue={inputValue}
              selectedItems={selectedItems}
            />
          )}
        </Box>
      </FormControl>
    );
  },
);
