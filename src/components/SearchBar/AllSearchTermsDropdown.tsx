import { ChevronDownIcon } from '@chakra-ui/icons';
import { Box, Flex, IconButton, Input, ListItem, usePopper, Text, Code, UnorderedList } from '@chakra-ui/react';
import { ReactElement, useMemo, useState, forwardRef } from 'react';
import { allSearchTerms, ISearchTermOption } from './models';
import { useCombobox } from 'downshift';
import { matchSorter } from 'match-sorter';

type ITermItem = Partial<ISearchTermOption> & {
  type: 'group' | 'item';
  title: string;
};

export interface IAllSearchTermsDropdown {
  onSelect: (value: string) => void;
}

export const AllSearchTermsDropdown = ({ onSelect }: IAllSearchTermsDropdown): ReactElement => {
  const allTermsItems = useMemo(() => {
    const tmp: ITermItem[] = [];
    Object.entries(allSearchTerms).forEach(([group, terms]) => {
      tmp.push({
        type: 'group',
        title: group,
      });
      Object.values(terms).forEach((term) => {
        tmp.push({
          type: 'item',
          ...term,
        });
      });
    });
    return tmp;
  }, [allSearchTerms]);

  const [items, setItems] = useState(allTermsItems);

  const [showTooltipFor, setShowTooltipFor] = useState<ITermItem>(null);

  const { popperRef: dropdownPopperRef, referenceRef: dropdownReferenceRef } = usePopper({
    placement: 'bottom-start',
  });

  const { popperRef: tooltipPopperRef, referenceRef: tooltipReferenceRef } = usePopper({
    placement: 'right-start',
    offset: [40, 20],
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
      setHighlightedIndex(1);
      setInputValue('');
      selectItem(null);
      if (!isOpen) {
        setShowTooltipFor(null);
      }
    },
    onHighlightedIndexChange: ({ highlightedIndex }) => {
      const item = items[highlightedIndex];
      if (isOpen && item && item.type === 'item') {
        setShowTooltipFor(item);
      }
      // keep tooltip shown when highlighted index is invalid (this means mouse moved away from menu)
      // only hide tooltip when menu is closed
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        onSelect(selectedItem.value); // callback
        setInputValue('');
      }
    },
    onInputValueChange: ({ inputValue }) => {
      if (!inputValue || inputValue.trim().length === 0) {
        setItems(allTermsItems);
        setHighlightedIndex(1);
      } else {
        const filtered = matchSorter(
          allTermsItems.filter((item) => item.type !== 'group'),
          inputValue,
          { keys: ['title'], threshold: matchSorter.rankings.WORD_STARTS_WITH },
        );
        setItems(filtered);
        if (filtered.length > 0) {
          setHighlightedIndex(0);
        } else {
          setShowTooltipFor(null);
        }
      }
    },
    itemToString: (item) => item?.title ?? '',
    menuId: 'allSearchTermsMenu',
    inputId: 'allSearchTermsInput',
    getItemId: (index) => `allSearchTermsItem-${index}`,
  });

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
      w="fit-content"
    >
      <Flex>
        <Input
          placeholder="all search terms"
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
        <IconButton
          icon={<ChevronDownIcon />}
          {...getToggleButtonProps()}
          borderLeftRadius={0}
          tabIndex={0}
          data-testid="allSearchTermsMenuToggle"
        />
      </Flex>
      <UnorderedList
        zIndex={10}
        bgColor="white"
        border={isOpen && items.length > 0 ? '1px' : 'none'}
        borderRadius={5}
        borderColor="gray.200"
        boxShadow="lg"
        maxHeight="400px"
        w="200px"
        overflow="scroll"
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
              color={term.type === 'group' ? 'gray.300' : 'gray.700'}
              fontWeight={term.type === 'group' ? 'bold' : 'normal'}
              backgroundColor={highlightedIndex === index ? 'blue.100' : 'auto'}
              {...getItemProps({
                item: term,
                index,
                disabled: term.type === 'group',
              })}
              p={2}
              pl={term.type === 'group' ? 2 : 4}
              data-testid="allSearchTermsMenuItem"
              cursor={term.type === 'group' ? 'default' : 'pointer'}
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
  term: ITermItem;
}
const SearchTermTooltip = forwardRef<HTMLDivElement, ISearchTermTooltipProps>(({ term }, ref) => {
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
    >
      <Text color="gray.900" fontWeight="bold" backgroundColor="gray.100" p={2} data-testid="allSearchTooltipTitle">
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
