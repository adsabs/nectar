import { useUATTermsSearch } from '@/api/uat/uat';
import { useColorModeColors } from '@/lib/useColorModeColors';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { usePopper, VStack, Tooltip, Box, UnorderedList, ListItem } from '@chakra-ui/react';
import { useSelect } from 'downshift';
import { useMemo } from 'react';
import { SearchQueryLink } from '../SearchQueryLink';

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
  // TODO: fetch keyword parents and childrens on isOpen
  const { data, isFetched } = useUATTermsSearch({ term: keyword, exact: true });

  const items = useMemo(() => {
    if (isFetched && !!data && data.uatTerms.length > 0 && data.uatTerms[0].name.toLowerCase() === keyword) {
      const uatTerm = data.uatTerms[0];
      const parents =
        uatTerm.broader?.map((n) => ({ type: 'item', label: n.name, value: n.name } as UATTermItem)) ??
        ([] as UATTermItem[]);
      const children =
        uatTerm.narrower?.map((n) => ({ type: 'item', label: n.name, value: n.name } as UATTermItem)) ??
        ([] as UATTermItem[]);
      const related =
        uatTerm.related?.map((n) => ({ type: 'item', label: n.name, value: n.name } as UATTermItem)) ??
        ([] as UATTermItem[]);

      return [
        { type: 'group', label: `Broader (${parents.length})` } as UATTermGroup,
        ...parents,
        { type: 'group', label: `Narrower  (${children.length})` } as UATTermGroup,
        ...children,
        { type: 'group', label: `Related  (${related.length})` } as UATTermGroup,
        ...related,
      ];
    }
    return [];
  }, [data, isFetched]);

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
          tabIndex={0}
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
        maxHeight="500px"
        w="fit-content"
        maxW="400px"
        overflowY="scroll"
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
              {isUATGroup(term) ? (
                <>{term.label}</>
              ) : (
                <SearchQueryLink params={{ q: `uat:"${term.value}"` }} textDecoration="none" color="inherit">
                  {term.label}
                </SearchQueryLink>
              )}
            </ListItem>
          ))}
      </UnorderedList>
    </VStack>
  );
};
