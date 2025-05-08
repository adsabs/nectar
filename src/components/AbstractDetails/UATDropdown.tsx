import { useColorModeColors } from '@/lib/useColorModeColors';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { usePopper, VStack, Tooltip, Box, UnorderedList, ListItem } from '@chakra-ui/react';
import { useSelect } from 'downshift';

export type UATTermItem = {
  type: 'item';
  label: string;
  value: string;
};

export type UATTermGroup = {
  type: 'group';
  label: string;
};

export type UATTermOption = UATTermItem | UATTermGroup;

const isUATGroup = (item: UATTermOption): item is UATTermGroup => item.type === 'group';

export const UATDropdown = ({ keyword }: { keyword: string }) => {
  // fetch keyword parents and childrens on isOpen

  console.log(keyword);

  const parents = [1, 2, 3, 4, 5].map(
    (n) => ({ type: 'item', label: `parent ${n}`, value: `parent ${n}` } as UATTermItem),
  );
  const children = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(
    (n) => ({ type: 'item', label: `child ${n}`, value: `child ${n}` } as UATTermItem),
  );

  const items: UATTermOption[] = [
    { type: 'group', label: 'Broader' } as UATTermGroup,
    ...parents,
    { type: 'group', label: 'Narrower' } as UATTermGroup,
    ...children,
  ];

  const { isOpen, getToggleButtonProps, getMenuProps, highlightedIndex, getItemProps } = useSelect({
    items,
    itemToString: (item) => item.label,
  });
  const { popperRef: dropdownPopperRef, referenceRef: dropdownReferenceRef } = usePopper({
    placement: 'right-start',
  });
  const colors = useColorModeColors();

  return (
    <VStack>
      <Tooltip label="related keywords">
        <Box
          variant="unstyled"
          {...getToggleButtonProps({
            ref: (el: HTMLInputElement) => {
              dropdownReferenceRef(el);
              return el;
            },
          })}
          m={1}
          cursor="pointer"
        >
          <ChevronDownIcon aria-label="Related keywords" boxSize={4} />
        </Box>
      </Tooltip>
      <UnorderedList
        zIndex={10}
        bgColor={colors.background}
        border={isOpen && items.length > 0 ? '1px' : 'none'}
        borderRadius={5}
        borderColor="gray.200"
        boxShadow="lg"
        maxHeight="400px"
        w="200px"
        overflowY="scroll"
        overflowX="hidden"
        {...getMenuProps({
          ref: (el: HTMLUListElement) => {
            dropdownPopperRef(el);
            return el;
          },
        })}
      >
        {isOpen &&
          items.map((term, index) => (
            <ListItem
              key={`${term}-${index}`}
              fontWeight={isUATGroup(term) ? 'bold' : 'normal'}
              color={
                isUATGroup(term) ? 'gray.300' : highlightedIndex === index ? colors.highlightForeground : colors.text
              }
              backgroundColor={highlightedIndex === index ? colors.highlightBackground : 'auto'}
              p={2}
              pl={isUATGroup(term) ? 2 : 4}
              cursor={isUATGroup(term) ? 'default' : 'pointer'}
              {...getItemProps({
                item: term,
                index,
                disabled: isUATGroup(term),
              })}
            >
              {term.label}
            </ListItem>
          ))}
      </UnorderedList>
    </VStack>
  );
};
