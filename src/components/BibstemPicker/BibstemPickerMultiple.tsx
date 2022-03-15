import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { Box, Flex, HStack } from '@chakra-ui/layout';
import { Tag, TagCloseButton, TagLabel } from '@chakra-ui/tag';
import { TextInput } from '@components/TextInput';
import { useCombobox, UseComboboxStateChange, useMultipleSelection } from 'downshift';
import dynamic from 'next/dynamic';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import type { IBibstemMenuProps } from './BibstemMenu';
import { ITEM_DELIMITER } from './models';

const BibstemMenu = dynamic<IBibstemMenuProps>(() => import('./BibstemMenu').then((module) => module.BibstemMenu), {
  loading: () => (
    <ul className="relative">
      <li>loading...</li>
    </ul>
  ),
  ssr: false,
});

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
    <HStack flexWrap="wrap" my={1}>
      {selectedItems.map((item, index) => {
        const bibstem = item.split(ITEM_DELIMITER)[0];
        return (
          <Tag key={`selected-item-${index}`} m={0} {...getSelectedItemProps({ selectedItem: item, index })}>
            <TagLabel>{bibstem}</TagLabel>
            <TagCloseButton onClick={() => removeSelectedItem(item)} />
          </Tag>
        );
      })}
    </HStack>
  );

  const dropdownProps = getDropdownProps({ preventKeyAction: isOpen }) as Record<string, unknown>;

  return (
    <FormControl>
      <FormLabel {...getLabelProps()}>Publication(s)</FormLabel>

      {renderPills()}

      <Flex {...getComboboxProps()}>
        <TextInput {...getInputProps(dropdownProps)} />
        {hiddenInput}
      </Flex>
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
};
