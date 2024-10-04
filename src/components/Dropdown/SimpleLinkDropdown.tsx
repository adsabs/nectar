import { ChevronDownIcon } from '@chakra-ui/icons';
import { Box, Flex } from '@chakra-ui/react';
import { ReactElement } from 'react';
import { ItemType } from './types';
import { SimpleLink } from '@/components/SimpleLink';

/** Non JavaScript dropdown */
export interface ISimpleLinkDropdownProps {
  items: ItemType[];
  label: string | ReactElement;
  minLabelWidth?: string;
  minListWidth?: string;
  alignRight?: boolean;
}

export const SimpleLinkDropdown = (props: ISimpleLinkDropdownProps): ReactElement => {
  const { items, label, minLabelWidth, minListWidth, alignRight } = props;

  return (
    <Box
      display="inline-block"
      position="relative"
      role="group"
      minW={minLabelWidth ? minLabelWidth : null}
      tabIndex={0}
    >
      {typeof label === 'string' ? (
        <Flex
          p={2}
          justifyContent="space-between"
          borderWidth={1}
          minW={minLabelWidth ? minLabelWidth : null}
          height="2.65em"
          cursor="pointer"
        >
          {label} <ChevronDownIcon aria-hidden="true" />
        </Flex>
      ) : (
        label
      )}
      <Box
        backgroundColor="white"
        borderRadius="md"
        minW={minListWidth ? minListWidth : null}
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
            key={item.id}
            flexDirection="column"
            _hover={{ backgroundColor: item.disabled ? 'transparent' : 'gray.100' }}
            p={2}
          >
            {item.disabled ? (
              <Box width="full" m={0} px={2}>
                <Box color="gray.200" cursor="not-allowed" aria-disabled>
                  {item.label}
                </Box>
              </Box>
            ) : (
              <Box key={item.id} href={item.path} variant="dropdownItem" as={SimpleLink} w="full" m={0} px={2}>
                {item.label}
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};
