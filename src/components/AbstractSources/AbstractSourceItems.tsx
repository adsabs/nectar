import { ChevronDownIcon } from '@chakra-ui/icons';
import { Menu, MenuButton, Button, MenuList, MenuItem, List, ListItem, BoxProps, Box } from '@chakra-ui/react';
import { ItemType } from '@components/Dropdown/types';
import { SimpleLink } from '@components/SimpleLink';

export type AbstractResourceType = Pick<ItemType, 'id' | 'label' | 'path'>;

export type FullTextResourceType = {
  label: string;
}[];

export interface IAbstractSourceItemsProps extends BoxProps {
  resources: AbstractResourceType[];
  type: 'list' | 'menu'; // List is used in an accordion, menu is a button and dropdown style
}

export const AbstractSourceItems = ({ resources, type, ...boxProps }: IAbstractSourceItemsProps) => {
  return (
    <Box {...boxProps}>
      {type === 'menu' ? (
        <Menu>
          <MenuButton as={Button} rightIcon={<ChevronDownIcon />} isDisabled={resources.length === 0}>
            Full Text Sources
          </MenuButton>
          {resources.length > 0 && (
            <MenuList>
              {resources.map((item) => (
                <MenuItem key={item.id} data-id={item.id} as={SimpleLink} href={item.path} newTab>
                  {item.label}
                </MenuItem>
              ))}
            </MenuList>
          )}
        </Menu>
      ) : (
        <List variant="accordion">
          {resources.map((item) => (
            <ListItem key={item.id} id={`${item.id}`}>
              <SimpleLink href={item.path} newTab>
                {item.label}
              </SimpleLink>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};
