'use client';

/**
 * Check if the NL Search feature is enabled via environment variable.
 * Set NEXT_PUBLIC_NL_SEARCH=enabled in .env.local to enable this feature.
 */
export const isNLSearchEnabled = (): boolean => {
  return process.env.NEXT_PUBLIC_NL_SEARCH === 'enabled';
};

import { ArrowForwardIcon, CheckIcon, CopyIcon } from '@chakra-ui/icons';
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
  Radio,
  RadioGroup,
  Spinner,
  Stack,
  Text,
  Tooltip,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { ChangeEvent, FC, useCallback, useState } from 'react';
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

export const NLSearch: FC<INLSearchProps> = ({ onQueryGenerated, onApplyQuery, debounceMs = 500 }) => {
  const [input, setInput] = useState('');
  const [debouncedInput] = useDebounce(input, debounceMs);
  const [hasCopied, setHasCopied] = useState(false);
  const { query, queries, selectedIndex, setSelectedIndex, isLoading, error, resultCount, isLoadingCount } =
    useNLSearch(debouncedInput, onQueryGenerated);
  const router = useRouter();
  const toast = useToast();

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
    </VStack>
  );
};

NLSearch.displayName = 'NLSearch';

/**
 * Wrapper component that conditionally renders NLSearch based on feature flag.
 * Only renders when NEXT_PUBLIC_NL_SEARCH=enabled is set.
 */
export const NLSearchWithFlag: FC<INLSearchProps> = (props) => {
  if (!isNLSearchEnabled()) {
    return null;
  }
  return <NLSearch {...props} />;
};

NLSearchWithFlag.displayName = 'NLSearchWithFlag';
