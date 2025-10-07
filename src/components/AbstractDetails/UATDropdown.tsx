import { useUATTermsSearch } from '@/api/uat/uat';
import { useColorModeColors } from '@/lib/useColorModeColors';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { makeSearchParams } from '@/utils/common/search';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { usePopper, Tooltip, Box, ListItem, List, Flex } from '@chakra-ui/react';
import { useSelect } from 'downshift';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { CustomInfoMessage, LoadingMessage } from '../Feedbacks';

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
  const colors = useColorModeColors();

  const router = useRouter();

  const [options, setOptions] = useState<UATTermOption[]>([]);

  const baseId = useMemo(() => {
    const normalizedKeyword = keyword
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `uat-dropdown-${normalizedKeyword || 'keyword'}`;
  }, [keyword]);

  const { isOpen, getToggleButtonProps, getMenuProps, highlightedIndex, getItemProps } = useSelect<UATTermOption>({
    items: options,
    itemToString: (option) => option?.label ?? '',
    id: baseId,
    labelId: `${baseId}-label`,
    menuId: `${baseId}-menu`,
    toggleButtonId: `${baseId}-toggle`,
    onSelectedItemChange: ({ selectedItem: option }) => {
      if (option.type === 'item') {
        const params = { q: `uat:"${option.value}"` };
        void router.push(`/search?${makeSearchParams(params)}`);
      }
    },
  });

  const { data, isFetching, isFetched, error } = useUATTermsSearch({ term: keyword, exact: true }, { enabled: isOpen });

  useEffect(() => {
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
      setOptions([
        { type: 'group', label: `Broader (${parents.length})` } as UATTermGroup,
        ...parents,
        { type: 'group', label: `Narrower  (${children.length})` } as UATTermGroup,
        ...children,
        { type: 'group', label: `Related  (${related.length})` } as UATTermGroup,
        ...related,
      ]);
    } else {
      setOptions([]);
    }
  }, [data, isFetched, keyword]);

  const { popperRef: dropdownPopperRef, referenceRef: dropdownReferenceRef } = usePopper({
    placement: 'right-start',
  });

  return (
    <Flex direction="column" align="center" display="inline-flex" w="auto">
      <Tooltip label="related keywords">
        <Box
          variant="unstyled"
          {...getToggleButtonProps({
            ref: (el: HTMLInputElement) => {
              dropdownReferenceRef(el);
              return el;
            },
          })}
          ml={1}
          cursor="pointer"
          tabIndex={0}
        >
          <ChevronDownIcon aria-label="Related keywords" boxSize={4} />
        </Box>
      </Tooltip>

      <Box
        zIndex={10}
        bgColor={colors.background}
        border={isOpen && options.length > 0 ? '1px' : 'none'}
        borderRadius={5}
        borderColor="gray.200"
        boxShadow="lg"
        maxHeight="500px"
        w={isOpen ? 'fit-content' : '0'}
        minW={isOpen ? '200px' : '0'}
        maxW={isOpen ? '400px' : '0'}
        overflowY="scroll"
        display={isOpen ? 'block' : 'none'}
        {...getMenuProps({
          ref: (el: HTMLUListElement) => {
            dropdownPopperRef(el);
            return el;
          },
        })}
      >
        {isOpen && (
          <>
            {isFetching ? (
              <LoadingMessage message={'Loading'} />
            ) : error ? (
              <CustomInfoMessage
                status="error"
                alertTitle={'Error'}
                description={parseAPIError(error)}
                w="fit-content"
              />
            ) : (
              <List>
                {options.map((option, index) => (
                  <ListItem
                    key={option.label}
                    fontWeight={isUATGroup(option) ? 'bold' : 'normal'}
                    color={
                      isUATGroup(option)
                        ? 'gray.300'
                        : highlightedIndex === index
                        ? colors.highlightForeground
                        : colors.text
                    }
                    backgroundColor={highlightedIndex === index ? colors.highlightBackground : 'auto'}
                    p={2}
                    pl={isUATGroup(option) ? 2 : 4}
                    cursor={isUATGroup(option) ? 'default' : 'pointer'}
                    role={isUATGroup(option) ? 'listitem' : 'link'}
                    {...getItemProps({
                      item: option,
                      index,
                      disabled: isUATGroup(option),
                    })}
                  >
                    {option.label}
                  </ListItem>
                ))}
              </List>
            )}
          </>
        )}
      </Box>
    </Flex>
  );
};
