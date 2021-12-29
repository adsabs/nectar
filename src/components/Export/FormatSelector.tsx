import { Menu, MenuButton, MenuOptionGroup, MenuItemOption, MenuList } from '@chakra-ui/menu';
import { Button } from '@chakra-ui/button';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import PT from 'prop-types';
import { ReactElement } from 'react';
import { exportFormats } from './constants';
import { ExportState } from './types';
import { ChevronDownIcon } from '@chakra-ui/icons';

interface IFormatSelectorProps {
  format: ExportState['format'];
  onFormatChange: (format: ExportState['format']) => void;
}

const propTypes = {
  format: PT.string.isRequired,
  onFormatChange: PT.func.isRequired,
};

export const FormatSelector = ({ format, onFormatChange }: IFormatSelectorProps): ReactElement => {
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
      {Object.values(exportFormats).find((v) => v.id === format).label} <ChevronDownIcon aria-hidden />
    </Button>
  );

  return (
    <FormControl>
      <FormLabel>Export Format</FormLabel>
      <Menu>
        <MenuButton minW="300px">{label}</MenuButton>
        <MenuList height="300px" overflow="scroll" minW="300px">
          <MenuOptionGroup onChange={onFormatChange} value={format}>
            {Object.values(exportFormats).map(({ label, id, help }) => (
              <MenuItemOption value={id} key={id} dataset-id={id} title={help}>
                {label}
              </MenuItemOption>
            ))}
          </MenuOptionGroup>
        </MenuList>
      </Menu>
    </FormControl>
  );
};

FormatSelector.propTypes = propTypes;
