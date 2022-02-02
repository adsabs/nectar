import { Menu, MenuButton, MenuOptionGroup, MenuItemOption, MenuList } from '@chakra-ui/menu';
import { Button } from '@chakra-ui/button';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { ReactElement, useState } from 'react';
import { ChevronDownIcon } from '@chakra-ui/icons';

export interface SelectOption {
  id: string;
  label: string;
  help?: string;
}

export interface ISelectProps {
  formLabel?: string;
  options: SelectOption[];
  defaultOption: string;
  onOptionSelected: (id: string) => void;
}

export const Select = ({ formLabel, options, defaultOption, onOptionSelected }: ISelectProps): ReactElement => {
  const [selected, setSelected] = useState<string>(defaultOption);
  const label = (
    <Button
      variant="outline"
      colorScheme="gray"
      width="full"
      borderRadius="sm"
      justifyContent="space-between"
      size="md"
      fontWeight="normal"
      role="none"
    >
      {options.find((option) => option.id === selected).label} <ChevronDownIcon aria-hidden />
    </Button>
  );

  const handleOptionSelected = (id: string) => {
    setSelected(id);
    onOptionSelected(id);
  };

  return (
    <FormControl>
      {formLabel && <FormLabel>{formLabel}</FormLabel>}
      <Menu matchWidth computePositionOnMount isLazy={false} lazyBehavior="keepMounted">
        <MenuButton minW="300px">{label}</MenuButton>
        <MenuList height="300px" overflow="scroll">
          <MenuOptionGroup onChange={handleOptionSelected} value={selected}>
            {options.map(({ label, id, help }) => (
              <MenuItemOption
                value={id}
                key={id}
                dataset-id={id}
                title={help ? help : 'null'}
                icon={<></>}
                backgroundColor={selected === id ? 'gray.100' : 'transparent'}
              >
                {label}
              </MenuItemOption>
            ))}
          </MenuOptionGroup>
        </MenuList>
      </Menu>
    </FormControl>
  );
};
