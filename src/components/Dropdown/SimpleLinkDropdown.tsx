import { Link, Text, Flex, Box } from '@chakra-ui/layout';
import NextLink from 'next/link';
import { ReactElement } from 'react';
import { ItemType } from './types';
import { ChevronDownIcon } from '@chakra-ui/icons';

/** Non JavaScript dropdown */
export interface ISimpleLinkDropdownProps {
  items: ItemType[];
  label: string | ReactElement;
  minWidth?: string;
  alignRight?: boolean;
}

export const SimpleLinkDropdown = (props: ISimpleLinkDropdownProps): ReactElement => {
  const { items, label, minWidth, alignRight } = props;

  return (
    <Box display="inline-block" position="relative" role="group">
      {typeof label === 'string' ? (
        <Flex
          p={2}
          justifyContent="space-between"
          borderWidth={1}
          borderRightWidth="0"
          minW={minWidth ? minWidth : null}
          height="2.65em"
        >
          {label} <ChevronDownIcon aria-hidden="true" />
        </Flex>
      ) : (
        label
      )}
      <Box
        backgroundColor="white"
        borderRadius="md"
        minW={minWidth ? minWidth : null}
        borderColor="gray.200"
        borderWidth={0.5}
        position="absolute"
        zIndex="10"
        display="none"
        _groupHover={{ display: 'block' }}
        _groupFocus={{ display: 'block' }}
        py={2}
        right={alignRight ? '0' : 'unset'}
      >
        {items.map((item) => (
          <Box
            direction="column"
            key={item.id}
            _hover={{ backgroundColor: item.disabled ? 'transparent' : 'gray.100' }}
            p={2}
          >
            {item.disabled ? (
              <Text color="gray.200">{item.label}</Text>
            ) : (
              <NextLink key={item.id} href={item.path} passHref>
                <Link rel="noreferrer noopener" target={item.newTab ? '_blank' : '_self'} variant="dropdownItem">
                  <Box width="full" m={0} px={2}>
                    {item.label}
                  </Box>
                </Link>
              </NextLink>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};
