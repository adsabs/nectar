'use client';

/**
 * Check if NL Search is enabled via env var or cookie toggle.
 * - Global: set NEXT_PUBLIC_NL_SEARCH=enabled in .env.local
 * - Per-user: visit any page with ?nl_search=1 (disable with ?nl_search=0)
 */
export const isNLSearchEnabled = (): boolean => {
  if (process.env.NEXT_PUBLIC_NL_SEARCH === 'enabled') {
    return true;
  }
  if (typeof document !== 'undefined') {
    return document.cookie.split('; ').some((c) => c === 'nl-search-enabled=1');
  }
  return false;
};

import { ArrowForwardIcon, CheckIcon, CopyIcon, WarningIcon } from '@chakra-ui/icons';
import {
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Select,
  Spinner,
  Stack,
  Text,
  Textarea,
  Tooltip,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { ChangeEvent, FC, useCallback, useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { makeSearchParams } from '@/utils/common/search';
import { useNLSearch } from './useNLSearch';

export interface INLSearchProps {
  onQueryGenerated?: (query: string) => void;
  onApplyQuery?: (query: string) => void;
  debounceMs?: number;
}

const formatResultCount = (count: number): string => {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toLocaleString();
};

const ISSUE_CATEGORIES = [
  { value: 'author_duplication', label: 'Author name in wrong fields' },
  { value: 'wrong_operator', label: 'Wrong or missing operator' },
  { value: 'wrong_field', label: 'Wrong field used' },
  { value: 'missing_field', label: 'Expected field missing' },
  { value: 'extra_field', label: 'Unexpected field added' },
  { value: 'syntax_error', label: 'Malformed query syntax' },
  { value: 'date_handling', label: 'Incorrect date parsing' },
  { value: 'other', label: 'Other issue' },
];

export const NLSearch: FC<INLSearchProps> = ({ onQueryGenerated, onApplyQuery, debounceMs = 500 }) => {
  const [input, setInput] = useState('');
  const [debouncedInput] = useDebounce(input, debounceMs);
  const [hasCopied, setHasCopied] = useState(false);
  const { query, queries, selectedIndex, setSelectedIndex, isLoading, error, resultCount, isLoadingCount } =
    useNLSearch(debouncedInput, onQueryGenerated);
  const router = useRouter();
  const toast = useToast();

  // Issue reporting state
  const { isOpen: isIssueOpen, onOpen: onIssueOpen, onClose: onIssueClose } = useDisclosure();
  const [expectedQuery, setExpectedQuery] = useState('');
  const [issueCategory, setIssueCategory] = useState('other');
  const [issueNotes, setIssueNotes] = useState('');
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

  // Get the currently selected query
  const selectedQuery = queries[selectedIndex]?.query || query;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSelectionChange = (value: string) => {
    setSelectedIndex(parseInt(value, 10));
  };

  const copyToClipboard = useCallback(() => {
    if (!selectedQuery) {
      return;
    }
    navigator.clipboard.writeText(selectedQuery);
    setHasCopied(true);
    toast({
      title: 'Query copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
    setTimeout(() => setHasCopied(false), 2000);
  }, [selectedQuery, toast]);

  const applyQuery = useCallback(() => {
    if (!selectedQuery) {
      return;
    }
    if (onApplyQuery) {
      onApplyQuery(selectedQuery);
    } else {
      const search = makeSearchParams({ q: selectedQuery });
      void router.push({ pathname: '/search', search });
    }
  }, [selectedQuery, onApplyQuery, router]);

  const openIssueModal = useCallback(() => {
    setExpectedQuery(selectedQuery || '');
    setIssueCategory('other');
    setIssueNotes('');
    onIssueOpen();
  }, [selectedQuery, onIssueOpen]);

  const submitIssue = useCallback(async () => {
    if (!input || !selectedQuery || !expectedQuery) {
      toast({
        title: 'Missing information',
        description: 'Please fill in the expected query',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsSubmittingIssue(true);
    try {
      const response = await fetch('/api/nl-report-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: input,
          actual: selectedQuery,
          expected: expectedQuery,
          category: issueCategory,
          notes: issueNotes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Issue reported',
          description: `Issue ${data.id} logged for training data improvement`,
          status: 'success',
          duration: 4000,
        });
        onIssueClose();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      toast({
        title: 'Failed to report issue',
        description: err instanceof Error ? err.message : 'Unknown error',
        status: 'error',
        duration: 4000,
      });
    } finally {
      setIsSubmittingIssue(false);
    }
  }, [input, selectedQuery, expectedQuery, issueCategory, issueNotes, toast, onIssueClose]);

  return (
    <VStack spacing={3} align="stretch" w="100%">
      <FormControl>
        <FormLabel>Describe your search in natural language</FormLabel>
        <InputGroup>
          <Input
            placeholder="e.g., papers by Hawking on black holes from the 1970s"
            value={input}
            onChange={handleChange}
            data-testid="nl-search-input"
          />
          {isLoading && (
            <InputRightElement>
              <Spinner size="sm" color="blue.500" data-testid="nl-search-loading" />
            </InputRightElement>
          )}
        </InputGroup>
      </FormControl>

      {error && (
        <Text color="red.500" fontSize="sm" data-testid="nl-search-error">
          {error}
        </Text>
      )}

      {queries.length > 0 && !isLoading && (
        <Box
          p={3}
          borderWidth="1px"
          borderRadius="md"
          bg="gray.50"
          _dark={{ bg: 'gray.700' }}
          data-testid="nl-query-suggestion"
        >
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between" align="center">
              <HStack spacing={2}>
                <Text fontSize="sm" fontWeight="medium">
                  Query Suggestions:
                </Text>
                {isLoadingCount && <Spinner size="xs" color="gray.500" data-testid="nl-search-count-loading" />}
                {!isLoadingCount && resultCount !== null && (
                  <Badge colorScheme="blue" fontSize="xs" data-testid="nl-search-result-count">
                    ~{formatResultCount(resultCount)} results
                  </Badge>
                )}
              </HStack>
              <HStack spacing={1}>
                <Tooltip label="Report issue with this query">
                  <IconButton
                    aria-label="Report issue"
                    icon={<WarningIcon />}
                    size="sm"
                    variant="ghost"
                    colorScheme="orange"
                    onClick={openIssueModal}
                    data-testid="nl-search-report-btn"
                  />
                </Tooltip>
                <Tooltip label={hasCopied ? 'Copied!' : 'Copy to clipboard'}>
                  <IconButton
                    aria-label="Copy query to clipboard"
                    icon={hasCopied ? <CheckIcon /> : <CopyIcon />}
                    size="sm"
                    variant="ghost"
                    colorScheme={hasCopied ? 'green' : 'gray'}
                    onClick={copyToClipboard}
                    data-testid="nl-search-copy-btn"
                  />
                </Tooltip>
                <Tooltip label="Apply query and search">
                  <Button
                    aria-label="Apply query"
                    leftIcon={<ArrowForwardIcon />}
                    size="sm"
                    colorScheme="blue"
                    onClick={applyQuery}
                    data-testid="nl-search-apply-btn"
                  >
                    Apply
                  </Button>
                </Tooltip>
              </HStack>
            </HStack>

            <RadioGroup value={String(selectedIndex)} onChange={handleSelectionChange}>
              <Stack spacing={2} data-testid="nl-query-options">
                {queries.map((suggestion, index) => (
                  <Box
                    key={index}
                    p={2}
                    borderRadius="sm"
                    bg={index === selectedIndex ? 'blue.50' : 'transparent'}
                    _dark={{ bg: index === selectedIndex ? 'blue.900' : 'transparent' }}
                    _hover={{ bg: index === selectedIndex ? 'blue.50' : 'gray.100' }}
                    cursor="pointer"
                    onClick={() => setSelectedIndex(index)}
                    data-testid={`nl-query-option-${index}`}
                  >
                    <HStack align="flex-start" spacing={2}>
                      <Radio value={String(index)} mt={1} />
                      <Box flex={1}>
                        <Text fontFamily="mono" fontSize="sm">
                          {suggestion.query}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {suggestion.description}
                        </Text>
                      </Box>
                    </HStack>
                  </Box>
                ))}
              </Stack>
            </RadioGroup>
          </VStack>
        </Box>
      )}

      {/* Issue Report Modal */}
      <Modal isOpen={isIssueOpen} onClose={onIssueClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Report Query Issue</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel fontSize="sm">Natural Language Input</FormLabel>
                <Input value={input} isReadOnly bg="gray.100" _dark={{ bg: 'gray.600' }} />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Generated Query (Actual)</FormLabel>
                <Input
                  value={selectedQuery || ''}
                  isReadOnly
                  bg="gray.100"
                  _dark={{ bg: 'gray.600' }}
                  fontFamily="mono"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm">Expected Query (Correct)</FormLabel>
                <Textarea
                  value={expectedQuery}
                  onChange={(e) => setExpectedQuery(e.target.value)}
                  placeholder="Enter the correct ADS query"
                  fontFamily="mono"
                  rows={2}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Issue Category</FormLabel>
                <Select value={issueCategory} onChange={(e) => setIssueCategory(e.target.value)}>
                  {ISSUE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Notes (optional)</FormLabel>
                <Textarea
                  value={issueNotes}
                  onChange={(e) => setIssueNotes(e.target.value)}
                  placeholder="Any additional context about the issue"
                  rows={2}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onIssueClose}>
              Cancel
            </Button>
            <Button colorScheme="orange" onClick={submitIssue} isLoading={isSubmittingIssue}>
              Report Issue
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

NLSearch.displayName = 'NLSearch';

/**
 * Hook that checks if NL Search is enabled, handling SSR/hydration safely.
 * Env var is checked immediately (build-time constant); cookie is checked after mount.
 */
const useNLSearchEnabled = (): boolean => {
  const [enabled, setEnabled] = useState(() => process.env.NEXT_PUBLIC_NL_SEARCH === 'enabled');

  useEffect(() => {
    if (!enabled) {
      const hasCookie = document.cookie.split('; ').some((c) => c === 'nl-search-enabled=1');
      if (hasCookie) {
        setEnabled(true);
      }
    }
  }, [enabled]);

  return enabled;
};

/**
 * Wrapper component that conditionally renders NLSearch based on feature flag.
 * Enabled globally via NEXT_PUBLIC_NL_SEARCH=enabled, or per-user via ?nl_search=1 cookie.
 */
export const NLSearchWithFlag: FC<INLSearchProps> = (props) => {
  const enabled = useNLSearchEnabled();
  if (!enabled) {
    return null;
  }
  return <NLSearch {...props} />;
};

NLSearchWithFlag.displayName = 'NLSearchWithFlag';
