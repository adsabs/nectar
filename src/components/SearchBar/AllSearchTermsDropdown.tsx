import {
  Box,
  Code,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  ListItem,
  Text,
  UnorderedList,
  usePopper,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useCombobox } from 'downshift';
import { matchSorter } from 'match-sorter';
import { forwardRef, ReactElement, useEffect, useState } from 'react';
import { allSearchTerms, SearchTermItem, SearchTermOption } from './models';
import { useColorModeColors } from '@/lib';

export interface IAllSearchTermsDropdown {
  onSelect: (value: string) => void;
}

const isItem = (item: SearchTermOption): item is SearchTermItem => item.type === 'item';

export const AllSearchTermsDropdown = ({ onSelect }: IAllSearchTermsDropdown): ReactElement => {
  const [items, setItems] = useState(allSearchTerms);

  const [showTooltipFor, setShowTooltipFor] = useState<SearchTermOption>(null);

  const { popperRef: dropdownPopperRef, referenceRef: dropdownReferenceRef } = usePopper({
    placement: 'bottom-start',
  });

  const { popperRef: tooltipPopperRef, referenceRef: tooltipReferenceRef } = usePopper({
    placement: 'right-start',
    offset: [40, 5],
  });

  const {
    isOpen,
    openMenu,
    closeMenu,
    getMenuProps,
    getToggleButtonProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
    setInputValue,
    setHighlightedIndex,
    selectItem,
  } = useCombobox({
    items: items,
    onIsOpenChange: ({ isOpen }) => {
      if (!isOpen) {
        setHighlightedIndex(-1);
        selectItem(null);
        setShowTooltipFor(null);
      }
    },
    onHighlightedIndexChange: ({ highlightedIndex }) => {
      const item = items[highlightedIndex];
      if (isOpen && item && isItem(item)) {
        setShowTooltipFor(item);
      }
      // keep tooltip shown when highlighted index is invalid (this means mouse moved away from menu)
      // only hide tooltip when menu is closed
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem && isItem(selectedItem)) {
        onSelect(selectedItem.value); // callback
        setInputValue('');
      }
    },
    onInputValueChange: ({ inputValue }) => {
      if (!inputValue || inputValue.trim().length === 0) {
        setItems(allSearchTerms);
      } else {
        const filtered = matchSorter(
          allSearchTerms.filter((item) => item.type !== 'group'),
          inputValue,
          { keys: ['title'], threshold: matchSorter.rankings.WORD_STARTS_WITH },
        );
        setItems(filtered);
      }
    },
    itemToString: (item) => item?.title ?? '',
    menuId: 'allSearchTermsMenu',
    inputId: 'allSearchTermsInput',
    getItemId: (index) => `allSearchTermsItem-${index}`,
    labelId: 'allSearchTermsLabel',
    toggleButtonId: 'allSearchTermsMenuToggle',
  });

  useEffect(() => {
    if (isOpen) {
      if (items.length === allSearchTerms.length) {
        setHighlightedIndex(1);
        setShowTooltipFor(allSearchTerms[1]);
      } else if (items.length === 0) {
        setHighlightedIndex(-1);
        setShowTooltipFor(null);
      } else {
        setHighlightedIndex(0);
        setShowTooltipFor(items[0]);
      }
    }
  }, [items]);

  const colors = useColorModeColors();

  const toggleIsOpen = () => {
    isOpen ? closeMenu() : openMenu();
  };

  return (
    <Box
      aria-label="all search terms dropdown"
      {...getComboboxProps({
        ref: (el: HTMLDivElement) => {
          tooltipReferenceRef(el);
          return el;
        },
      })}
      w="200px"
    >
      <Flex>
        <InputGroup>
          <Input
            placeholder="all search terms"
            fontSize="md"
            {...getInputProps({
              ref: (el: HTMLInputElement) => {
                dropdownReferenceRef(el);
                return el;
              },
              onKeyDown: (event) => {
                if (event.key === 'Enter') {
                  if (items.length === 0 || !isOpen) {
                    // Prevent Downshift's default 'Enter' behavior if invalid input or no input
                    (
                      event.nativeEvent as typeof event.nativeEvent & { preventDownshiftDefault: boolean }
                    ).preventDownshiftDefault = true;
                    event.preventDefault(); // this will prevent entering for search
                    closeMenu();
                  }
                }
              },
            })}
            onClick={toggleIsOpen}
            data-testid="allSearchTermsInput"
          />
          <InputRightElement
            children={<ChevronDownIcon boxSize={6} color="gray.200" />}
            data-testid="allSearchTermsMenuToggle"
            {...getToggleButtonProps()}
          />
        </InputGroup>
      </Flex>
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
        data-testid="allSearchTermsMenu"
      >
        {isOpen &&
          items.map((term, index) => (
            <ListItem
              key={`${term.type}-${term.title}`}
              color={!isItem(term) ? 'gray.300' : highlightedIndex === index ? colors.highlightForeground : colors.text}
              fontWeight={!isItem(term) ? 'bold' : 'normal'}
              backgroundColor={highlightedIndex === index ? colors.highlightBackground : 'auto'}
              {...getItemProps({
                item: term,
                index,
                disabled: !isItem(term),
              })}
              p={2}
              pl={!isItem(term) ? 2 : 4}
              data-testid="allSearchTermsMenuItem"
              cursor={!isItem(term) ? 'default' : 'pointer'}
            >
              {term.title}
            </ListItem>
          ))}
      </UnorderedList>
      {showTooltipFor && <SearchTermTooltip term={showTooltipFor} ref={tooltipPopperRef} />}
    </Box>
  );
};

interface ISearchTermTooltipProps {
  term: SearchTermOption;
}
const SearchTermTooltip = forwardRef<HTMLDivElement, ISearchTermTooltipProps>(({ term }, ref) => {
  const colors = useColorModeColors();

  if (!isItem(term)) {
    return null;
  }
  return (
    <Box
      as="div"
      ref={ref}
      bg="white"
      borderColor="gray.200"
      borderWidth={1}
      borderRadius={5}
      w={300}
      zIndex={10}
      m={5}
      data-testid="allSearchTermsTooltip"
      display={{ base: 'none', md: 'initial' }}
      color={colors.text}
      backgroundColor={colors.background}
    >
      <Text fontWeight="bold" p={2} data-testid="allSearchTooltipTitle">
        {term.title}
      </Text>
      <Text p={2} dangerouslySetInnerHTML={{ __html: term.description }} data-testid="allSearchTooltipDesc" />
      <Text p={2} data-testid="allSearchTooltipSyntax">
        Syntax:
        {term.syntax.map((s) => (
          <span key={s}>
            <br />
            <Code>{s}</Code>
          </span>
        ))}
      </Text>
      <Text p={2} data-testid="allSearchTooltipExample">
        Example:
        {term.example.map((e) => (
          <span key={e}>
            <br />
            <Code>{e}</Code>
          </span>
        ))}
      </Text>
    </Box>
  );
});
