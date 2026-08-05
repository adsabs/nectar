import { SearchIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Code,
  Flex,
  Input,
  Kbd,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
  Tooltip,
  useDisclosure,
} from '@chakra-ui/react';
import DOMPurify from 'isomorphic-dompurify';
import { matchSorter } from 'match-sorter';
import { KeyboardEvent, ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { allSearchTerms, SearchTermItem, SearchTermOption } from '@/components/SearchBar/models';
import { useColorModeColors } from '@/lib/useColorModeColors';

export interface IAllSearchTermsModalProps {
  onSelect: (value: string, cursorPos?: number) => void;
}

const isItem = (option: SearchTermOption): option is SearchTermItem => option.type === 'item';

// Stable DOM ids so the filter input can point aria-activedescendant/aria-controls
// at the listbox and its active row (screen-reader arrow-key support).
const LISTBOX_ID = 'all-search-terms-listbox';
const optionId = (id: string): string => `all-search-term-${id}`;

// DOMPurify strips `target` by default (tabnabbing defense), so re-add it via a
// hook and pair it with rel=noopener. Add/sanitize/remove is synchronous, so the
// global hook never leaks into other sanitize calls.
const sanitizeDescription = (html: string): string => {
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
  const clean = DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });
  DOMPurify.removeHook('afterSanitizeAttributes');
  return clean;
};

const filterTerms = (query: string): SearchTermOption[] => {
  if (query.trim().length === 0) {
    return allSearchTerms;
  }
  return matchSorter(allSearchTerms.filter(isItem), query, {
    keys: ['title'],
    threshold: matchSorter.rankings.WORD_STARTS_WITH,
  });
};

export const AllSearchTermsModal = ({ onSelect }: IAllSearchTermsModalProps): ReactElement => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const colors = useColorModeColors();
  const activeRowRef = useRef<HTMLDivElement>(null);

  const options = useMemo(() => filterTerms(query), [query]);
  const items = useMemo(() => options.filter(isItem), [options]);
  // Precompute id -> index so each row resolves its position in O(1) instead of
  // items.indexOf(option) inside the render loop (O(n²) over a large term list).
  const itemIndexById = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item, index) => map.set(item.id, index));
    return map;
  }, [items]);
  const current = items[highlighted] ?? null;

  useEffect(() => setHighlighted(0), [query]);

  // keep the active row visible during arrow-key nav
  useEffect(() => {
    activeRowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  const handleSelect = (item: SearchTermItem) => {
    onSelect(item.value, item.cursorPos);
    setQuery('');
    onClose();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (items.length === 0) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted((prev) => (prev + 1) % items.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((prev) => (prev - 1 + items.length) % items.length);
    } else if (event.key === 'Enter' && current) {
      event.preventDefault();
      handleSelect(current);
    }
  };

  return (
    <>
      <Tooltip label="All search terms">
        <Button
          aria-label="all search terms"
          variant="outline"
          size="sm"
          fontSize="md"
          fontWeight="normal"
          onClick={onOpen}
          data-tour="all-search-terms"
          data-testid="allSearchTermsTrigger"
        >
          <SearchIcon boxSize="0.7em" />
          {/* label collapses to an icon-only button on narrow screens */}
          <Box as="span" display={{ base: 'none', md: 'inline' }} ml={2}>
            all search terms
          </Box>
        </Button>
      </Tooltip>
      {/* On select the reducer refocuses the search input; Chakra's default
          focus-return would steal it back to the trigger. */}
      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside" returnFocusOnClose={false}>
        <ModalOverlay />
        <ModalContent color={colors.text} backgroundColor={colors.background}>
          <ModalBody p={0}>
            <Input
              autoFocus
              variant="unstyled"
              placeholder="Search fields, operators, and characters…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              px={4}
              py={3}
              fontSize="lg"
              borderBottomWidth="1px"
              borderColor={colors.border}
              borderRadius={0}
              role="combobox"
              aria-label="All Search Terms"
              aria-expanded="true"
              aria-autocomplete="list"
              aria-controls={LISTBOX_ID}
              aria-activedescendant={current ? optionId(current.id) : undefined}
              data-testid="allSearchTermsInput"
            />
            {/* List and detail sit side-by-side on md+ so the mouse can reach the
                detail pane (which may contain links) without crossing other rows
                and re-triggering hover selection; they stack on narrow screens. */}
            <Flex direction={{ base: 'column', md: 'row' }} align="stretch">
              <Box
                id={LISTBOX_ID}
                role="listbox"
                aria-label="Search terms"
                flex={{ base: '1 1 auto', md: '1 1 55%' }}
                minW={0}
                maxH="360px"
                overflowY="auto"
                borderBottomWidth={{ base: '1px', md: 0 }}
                borderRightWidth={{ base: 0, md: '1px' }}
                borderColor={colors.border}
                data-testid="allSearchTermsMenu"
              >
                {options.map((option) => {
                  if (!isItem(option)) {
                    return (
                      <Text
                        key={`group-${option.title}`}
                        px={4}
                        pt={3}
                        pb={1}
                        fontSize="xs"
                        textTransform="uppercase"
                        color={colors.disabledText}
                      >
                        {option.title}
                      </Text>
                    );
                  }
                  const index = itemIndexById.get(option.id) ?? -1;
                  const isActive = index === highlighted;
                  return (
                    <Flex
                      key={option.id}
                      ref={isActive ? activeRowRef : undefined}
                      id={optionId(option.id)}
                      role="option"
                      aria-selected={isActive}
                      px={4}
                      py={2}
                      align="center"
                      justify="space-between"
                      cursor="pointer"
                      backgroundColor={isActive ? colors.highlightBackground : undefined}
                      color={isActive ? colors.highlightForeground : undefined}
                      onMouseEnter={() => setHighlighted(index)}
                      onClick={() => handleSelect(option)}
                      data-testid="allSearchTermsMenuItem"
                    >
                      <Text>{option.title}</Text>
                      <Code fontSize="xs" backgroundColor="transparent" color="inherit">
                        {option.syntax[0]}
                      </Code>
                    </Flex>
                  );
                })}
                {items.length === 0 && (
                  <Text px={4} py={3} color={colors.disabledText}>
                    No matching terms.
                  </Text>
                )}
              </Box>
              <Box
                flex={{ base: '1 1 auto', md: '1 1 45%' }}
                minW={0}
                px={4}
                py={3}
                minH="90px"
                data-testid="allSearchTermsDetail"
              >
                {current ? (
                  <>
                    <Text fontWeight="bold" data-testid="allSearchTermsDetailTitle">
                      {current.title}
                    </Text>
                    <Text
                      fontSize="sm"
                      // descriptions may contain anchor tags (bibstem/inst); sanitize
                      dangerouslySetInnerHTML={{ __html: sanitizeDescription(current.description) }}
                    />
                    <Text
                      fontSize="xs"
                      color={colors.disabledText}
                      mt={1}
                      overflowWrap="anywhere"
                      data-testid="allSearchTermsDetailSyntax"
                    >
                      Syntax:{' '}
                      {current.syntax.map((s) => (
                        <Code key={s} fontSize="xs" mr={1}>
                          {s}
                        </Code>
                      ))}
                    </Text>
                    <Text
                      fontSize="xs"
                      color={colors.disabledText}
                      mt={1}
                      overflowWrap="anywhere"
                      data-testid="allSearchTermsDetailExample"
                    >
                      Example:{' '}
                      {current.example.map((e) => (
                        <Code key={e} fontSize="xs" mr={1}>
                          {e}
                        </Code>
                      ))}
                    </Text>
                  </>
                ) : (
                  <Text fontSize="sm" color={colors.disabledText}>
                    No selection.
                  </Text>
                )}
              </Box>
            </Flex>
            <Flex
              borderTopWidth="1px"
              borderColor={colors.border}
              px={4}
              py={3}
              gap={3}
              fontSize="xs"
              color={colors.disabledText}
            >
              <Text>
                <Kbd>↑</Kbd> <Kbd>↓</Kbd> navigate
              </Text>
              <Text>
                <Kbd>↵</Kbd> insert
              </Text>
              <Text>
                <Kbd>esc</Kbd> close
              </Text>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
