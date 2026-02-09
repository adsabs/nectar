import { ChevronDownIcon, Icon, LockIcon, UnlockIcon } from '@chakra-ui/icons';
import {
  Badge,
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
  Tag,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { ItemType } from '@/components/Dropdown/types';
import { GenericFileIcon } from '@/components/icons/GenericFileIcon';
import { HtmlFileIcon } from '@/components/icons/HtmlFileIcon';
import { PdfFileIcon } from '@/components/icons/PdfFileIcon';
import { SimpleLink } from '@/components/SimpleLink';
import { AcademicCapIcon } from '@heroicons/react/24/solid';
import { getAccessLabel, getGroupAccessLabel } from './accessLabel';
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
  type: 'list' | 'menu';
}

export interface IFullTextSourceItemsProps extends BoxProps {
  resources: FullTextResourceType[];
  type: 'list' | 'menu';
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
        <Menu id="tour-full-text-sources">
          <MenuButton as={Button} rightIcon={<ChevronDownIcon />} isDisabled={resources.length === 0}>
            Full Text Sources
          </MenuButton>
          {resources.length > 0 && (
            <MenuList>
              {resources.map((group) => (
                <Fragment key={group.label}>
                  {group.links.map((link) => {
                    const access = getAccessLabel(link.open, link.rawType);
                    const typeLabel = link.type.toLocaleUpperCase();

                    return (
                      <MenuItem key={link.rawType} as={SimpleLink} href={link.path} newTab>
                        {link.rawType === Esources.INSTITUTION ? (
                          <Icon as={AcademicCapIcon} mr={1} boxSize={6} color="gray.600" />
                        ) : link.open ? (
                          <UnlockIcon color="green.600" mr={1} />
                        ) : (
                          <LockIcon mr={1} />
                        )}
                        <Flex direction="row" justifyContent="space-between" alignItems="center" flex={1}>
                          <Text>
                            {link.rawType === Esources.INSTITUTION ? group.label : `${group.label} ${typeLabel}`}
                          </Text>
                          {access && (
                            <Tag size="sm" variant="subtle" colorScheme={access.colorScheme} ml={2}>
                              {access.badge}
                            </Tag>
                          )}
                        </Flex>
                      </MenuItem>
                    );
                  })}
                </Fragment>
              ))}
            </MenuList>
          )}
        </Menu>
      ) : (
        <List variant="accordion">
          {resources.map((group) => {
            const access = getGroupAccessLabel(group.links);

            return (
              <ListItem key={group.label}>
                <Flex direction="row" justifyContent="space-between" alignItems="center">
                  <HStack spacing={2} minW={0}>
                    <Text noOfLines={1}>{group.label}</Text>
                    {access && (
                      <Badge
                        variant="subtle"
                        colorScheme={access.colorScheme}
                        borderRadius="full"
                        px={2}
                        py={0.5}
                        fontSize="2xs"
                        whiteSpace="nowrap"
                        title={access.badge}
                      >
                        {access.badge}
                      </Badge>
                    )}
                  </HStack>
                  <HStack spacing={1}>
                    {group.links.map((link) => {
                      const linkAccess = getAccessLabel(link.open, link.rawType);
                      const isInstitution = link.rawType === Esources.INSTITUTION;
                      const accessText = isInstitution
                        ? ''
                        : linkAccess
                        ? `${link.type.toLocaleUpperCase()} — ${linkAccess.badge}`
                        : link.type.toLocaleUpperCase();
                      const label = isInstitution ? group.label : `${group.label} ${accessText}`;

                      return (
                        <Tooltip label={label} shouldWrapChildren key={link.rawType}>
                          <IconButton
                            aria-label={label}
                            icon={
                              link.rawType === Esources.INSTITUTION ? (
                                <Icon as={AcademicCapIcon} boxSize={6} color="gray.600" />
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
                            size="xs"
                          />
                        </Tooltip>
                      );
                    })}
                  </HStack>
                </Flex>
              </ListItem>
            );
          })}
        </List>
      )}
    </Box>
  );
};
