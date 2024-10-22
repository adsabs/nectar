import { ChevronDownIcon, Icon, LockIcon, UnlockIcon } from '@chakra-ui/icons';
import {
  Box,
  BoxProps,
  Button,
  Flex,
  HStack,
  IconButton,
  List,
  ListItem,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from '@chakra-ui/react';
import { ItemType } from '@/components/Dropdown/types';
import { GenericFileIcon } from '@/components/icons/GenericFileIcon';
import { HtmlFileIcon } from '@/components/icons/HtmlFileIcon';
import { PdfFileIcon } from '@/components/icons/PdfFileIcon';
import { SimpleLink } from '@/components/SimpleLink';
import { AcademicCapIcon } from '@heroicons/react/24/solid';
import { IFullTextSource } from './types';
import { Fragment } from 'react';
import { Esources } from '@/api/search/types';

export type AbstractResourceType = Pick<ItemType, 'id' | 'label' | 'path'>;

export type FullTextResourceType = {
  label: string;
  links: {
    type: 'pdf' | 'html' | string;
    path: string;
    open: boolean;
    rawType: IFullTextSource['rawType'];
  }[];
};

export interface IAbstractSourceItemsProps extends BoxProps {
  resources: AbstractResourceType[];
  type: 'list' | 'menu'; // List is used in an accordion, menu is a button and dropdown style
}

export interface IFullTextSourceItemsProps extends BoxProps {
  resources: FullTextResourceType[];
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

export const FullTextSourceItems = ({ resources, type, ...boxProps }: IFullTextSourceItemsProps) => {
  return (
    <Box {...boxProps}>
      {type === 'menu' ? (
        <Menu>
          <MenuButton as={Button} rightIcon={<ChevronDownIcon />} isDisabled={resources.length === 0}>
            Full Text Sources
          </MenuButton>
          {resources.length > 0 && (
            <MenuList>
              {resources.map((group) => (
                <Fragment key={group.label}>
                  {group.links.map((link) => (
                    <MenuItem key={link.rawType} as={SimpleLink} href={link.path} newTab>
                      {link.rawType === Esources.INSTITUTION ? (
                        <Icon as={AcademicCapIcon} mr={1} />
                      ) : link.open ? (
                        <UnlockIcon color="green.600" mr={1} />
                      ) : (
                        <LockIcon mr={1} />
                      )}
                      {`${group.label} ${link.type.toLocaleUpperCase()}`}
                    </MenuItem>
                  ))}
                </Fragment>
              ))}
            </MenuList>
          )}
        </Menu>
      ) : (
        <List variant="accordion">
          {resources.map((group) => (
            <ListItem key={group.label}>
              <Flex direction="row" justifyContent="space-between">
                <Text>{group.label}</Text>
                <HStack>
                  {group.links.map((link) => (
                    <IconButton
                      aria-label={`${group.label} ${link.type}`}
                      key={link.rawType}
                      icon={
                        link.rawType === Esources.INSTITUTION ? (
                          <AcademicCapIcon />
                        ) : link.type === 'pdf' ? (
                          <PdfFileIcon fill={link.open ? 'green' : 'gray'} />
                        ) : link.type === 'html' ? (
                          <HtmlFileIcon fill={link.open ? 'green' : 'gray'} />
                        ) : (
                          <GenericFileIcon fill={link.open ? 'green' : 'gray'} />
                        )
                      }
                      variant="unstyled"
                      as={SimpleLink}
                      href={link.path}
                      newTab
                    />
                  ))}
                </HStack>
              </Flex>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};
