import { Box, Flex, Text } from '@chakra-ui/react';
import { ReactElement } from 'react';
import { ItemType } from './types';
import { SimpleLink } from '@/components/SimpleLink';

/** Non JavaScript dropdown */
export interface ISimpleLinkListProps {
  items: ItemType[];
  selected?: string;
  minWidth?: string;
  label: string;
  showLabel?: boolean;
  asRow?: boolean;
}

export const SimpleLinkList = (props: ISimpleLinkListProps): ReactElement => {
  const { items, selected, minWidth, label, showLabel = false, asRow } = props;

  return (
    <Flex direction="column">
      {showLabel && <Text fontWeight="bold">{label}</Text>}
      {!asRow && (
        <Box
          background="transparent"
          borderRadius="md"
          minW={minWidth ? minWidth : null}
          borderColor="gray.200"
          borderWidth={0.5}
          py={2}
          aria-label={label}
          role="list"
        >
          {items.length === 0 && (
            <Text m={0} px={4} py={2} color="gray.100">
              None
            </Text>
          )}
          {items.map((item) => (
            <Box
              key={item.id}
              _hover={{ backgroundColor: item.disabled ? 'transparent' : 'gray.100' }}
              backgroundColor={selected && selected === item.id ? 'gray.100' : 'transparent'}
              role="listitem"
            >
              {item.disabled ? (
                <Box width="full" m={0} px={4} py={2}>
                  <Box color="gray.200" cursor="not-allowed" aria-disabled>
                    {item.label}
                  </Box>
                </Box>
              ) : (
                <SimpleLink
                  href={item.path}
                  newTab={item.newTab}
                  variant="dropdownItem"
                  display="inline-block"
                  _focus={{ backgroundColor: item.disabled ? 'transparent' : 'gray.100' }}
                  w="full"
                >
                  <Box width="full" m={0} px={4} py={2}>
                    {item.label}
                  </Box>
                </SimpleLink>
              )}
            </Box>
          ))}
        </Box>
      )}
      {asRow && (
        <Flex wrap="wrap">
          {items.length === 0 && (
            <Text m={0} px={4} py={2} color="gray.100">
              None
            </Text>
          )}
          {items.map((item) => (
            <Box key={item.id} p={2}>
              {item.disabled ? (
                <Text color="gray.200">{item.label}</Text>
              ) : (
                <SimpleLink href={item.path} fontWeight={selected === item.id ? 'bold' : 'normal'} newTab={item.newTab}>
                  {item.label}
                </SimpleLink>
              )}
            </Box>
          ))}
        </Flex>
      )}
    </Flex>
  );
};
