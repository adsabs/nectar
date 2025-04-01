import { IADSApiSearchParams } from '@/api/search/types';
import { composeNextGSSP } from '@/ssr-utils';

import { SimpleLink } from '@/components/SimpleLink';
import { APP_DEFAULTS, BRAND_NAME_FULL } from '@/config';
import { useBackToSearchResults } from '@/lib/useBackToSearchResults';
import { unwrapStringValue } from '@/utils/common/formatters';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import {
  Flex,
  HStack,
  Heading,
  Box,
  Alert,
  AlertIcon,
  Text,
  Checkbox,
  Stack,
  useDisclosure,
  Button,
} from '@chakra-ui/react';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { parseQueryFromUrl } from '@/utils/common/search';
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { fetchSearch, searchKeys } from '@/api/search/search';
import { citationHelperKeys, fetchCitationHelper, useCitationHelper } from '@/api/citation_helper/citation_helper';
import { ICitationHelperParams, ISuggestionEntry } from '@/api/citation_helper/types';
import { logger } from '@/logger';
import { parseAPIError } from '@/utils/common/parseAPIError';
import axios from 'axios';
import { LoadingMessage, StandardAlertMessage } from '@/components/Feedbacks';
import { HideOnPrint } from '@/components/HideOnPrint';
import { useColorModeColors } from '@/lib/useColorModeColors';
import { MathJax } from 'better-react-mathjax';
import { useState } from 'react';
import { AddToLibraryModal } from '@/components/Libraries';
import { useSession } from '@/lib/useSession';

interface ICitationHelperPageProps {
  query: IADSApiSearchParams;
  bibcodes: string[];
  error?: string;
}

export const CitationHelperPage: NextPage<ICitationHelperPageProps> = ({ query, bibcodes, error }) => {
  const { getSearchHref, show: showSearchHref } = useBackToSearchResults();

  const { isOpen: isAddToLibraryOpen, onClose: onCloseAddToLibrary, onOpen: onOpenAddToLibrary } = useDisclosure();

  const [selectedSuggestions, setSelectedSuggestions] = useState(new Set<string>());

  const { isAuthenticated } = useSession();

  const colors = useColorModeColors();

  const {
    data: suggestions,
    isLoading: isCitationHelperLoading,
    isError: isCitationHelperError,
    error: citationHelperError,
  } = useCitationHelper({ bibcodes: bibcodes }, { enabled: bibcodes.length > 0 });

  return (
    <>
      <Head>
        <title>{`${unwrapStringValue(query?.q)} - ${BRAND_NAME_FULL} Citation Helper`}</title>
      </Head>
      <Flex direction="column">
        <HStack my={10}>
          {showSearchHref && (
            <SimpleLink href={getSearchHref()}>
              <ChevronLeftIcon w={8} h={8} />
            </SimpleLink>
          )}
          <Heading as="h2" fontSize="2xl">
            Citation Helper
          </Heading>
        </HStack>

        <Box pt="1">
          {error ? (
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          ) : isCitationHelperLoading ? (
            <LoadingMessage message="Loading..." />
          ) : isCitationHelperError ? (
            <StandardAlertMessage title={'Error'} description={parseAPIError(citationHelperError)} />
          ) : Array.isArray(suggestions) ? (
            <>
              {isAuthenticated && (
                <Stack
                  direction="row"
                  justifyContent={{ md: 'space-between' }}
                  backgroundColor={colors.panel}
                  borderRadius="2px"
                  p={2}
                  my={2}
                >
                  <SelectAllCheckbox
                    isAllSelected={selectedSuggestions.size === suggestions.length}
                    isSomeSelected={selectedSuggestions.size > 0 && selectedSuggestions.size < suggestions.length}
                    onChange={(isChecked: boolean) =>
                      setSelectedSuggestions(isChecked ? new Set(suggestions.map((s) => s.bibcode)) : new Set())
                    }
                  />
                  <Button onClick={onOpenAddToLibrary} isDisabled={selectedSuggestions.size === 0} width="fit-content">
                    Add to library
                  </Button>
                </Stack>
              )}
              {suggestions.map((d) => (
                <Item
                  entry={d}
                  key={d.bibcode}
                  showCheckbox={isAuthenticated}
                  isSelected={selectedSuggestions.has(d.bibcode)}
                  setSelected={(s) => {
                    if (s) {
                      setSelectedSuggestions((prev) => {
                        const newSet = new Set(prev);
                        newSet.add(d.bibcode);
                        return newSet;
                      });
                    } else {
                      setSelectedSuggestions((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(d.bibcode);
                        return newSet;
                      });
                    }
                  }}
                />
              ))}
            </>
          ) : (
            <StandardAlertMessage
              status="error"
              title={suggestions.Error}
              description={<div dangerouslySetInnerHTML={{ __html: suggestions['Error Info'] }} />}
            />
          )}
        </Box>
      </Flex>
      <AddToLibraryModal
        isOpen={isAddToLibraryOpen}
        onClose={onCloseAddToLibrary}
        bibcodes={Array.from(selectedSuggestions)}
      />
    </>
  );
};

export const Item = ({
  entry,
  isSelected = false,
  setSelected,
  showCheckbox,
}: {
  entry: ISuggestionEntry;
  isSelected: boolean;
  setSelected: (selected: boolean) => void;
  showCheckbox: boolean;
}) => {
  const { bibcode, title, author, score } = entry;

  const colors = useColorModeColors();

  return (
    <Flex direction="row" as="article" border="1px" borderColor={colors.border} mb={1} borderRadius="md">
      {showCheckbox && (
        <Flex
          as={HideOnPrint}
          direction="row"
          backgroundColor={isSelected ? colors.panelHighlight : colors.panel}
          justifyContent="center"
          alignItems="center"
          mr="2"
          px="2"
          borderLeftRadius="md"
          w="64px"
        >
          <Checkbox aria-label={title} isChecked={isSelected} onChange={(e) => setSelected(e.target.checked)} />
        </Flex>
      )}
      <Stack direction="column" width="full" spacing={0} mx={3} my={2}>
        <Flex justifyContent="space-between">
          <SimpleLink href={`/abs/${bibcode}/abstract`} fontWeight="semibold" newTab>
            <Text as={MathJax} dangerouslySetInnerHTML={{ __html: unwrapStringValue(title) }} />
          </SimpleLink>
          <Text fontSize="sm">Score: {score}</Text>
        </Flex>
        <Text>{author}</Text>
      </Stack>
    </Flex>
  );
};

const SelectAllCheckbox = ({
  isAllSelected,
  isSomeSelected,
  onChange,
}: {
  isAllSelected: boolean;
  isSomeSelected: boolean;
  onChange: (isChecked: boolean) => void;
}) => {
  const handleChange = () => {
    onChange(!isAllSelected && !isSomeSelected);
  };

  return (
    <Checkbox
      size="md"
      isChecked={isAllSelected}
      isIndeterminate={!isAllSelected && isSomeSelected}
      onChange={handleChange}
      data-testid="listactions-checkbox"
      aria-label={isSomeSelected || isAllSelected ? 'deselect all' : 'select all'}
      px={4}
    />
  );
};

export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx) => {
  const { qid = null, p, n, ...query } = parseQueryFromUrl<{ qid: string }>(ctx.req.url);

  if (!query && !qid) {
    return {
      props: {
        query: null,
        bibcode: [],
        error: 'No Records',
      },
    };
  }

  // query to get the first 100 (default input size of citation helper) bibcodes
  // of either the query (or the qid if there is one)
  const queryClient = new QueryClient();
  const params: IADSApiSearchParams = {
    rows: APP_DEFAULTS.CITATION_HELPER_INPUT_SIZE,
    start: 0,
    fl: ['bibcode'],
    ...(qid ? { q: `docs(${qid})`, sort: query.sort } : query),
  };

  try {
    // primary search, this is based on query params
    const data = await queryClient.fetchQuery({
      queryKey: searchKeys.primary(params),
      queryFn: fetchSearch,
      meta: { params },
    });

    // extract bibcodes
    const records = data.response.docs.map((d) => d.bibcode);

    const citationHelperParams: ICitationHelperParams = {
      bibcodes: records,
    };

    // fetch citation helper
    void (await queryClient.prefetchQuery({
      queryKey: citationHelperKeys.search(citationHelperParams),
      queryFn: fetchCitationHelper,
      meta: { params: citationHelperParams },
    }));

    const dehydratedState = JSON.parse(JSON.stringify(dehydrate(queryClient)));

    return {
      props: {
        query: query,
        bibcodes: records,
        dehydratedState,
      },
    };
  } catch (error) {
    logger.error({ msg: 'GSSP error in citation helper page', error });
    return {
      props: {
        query,
        bibcodes: [],
        pageError: parseAPIError(error),
        error: axios.isAxiosError(error) ? error.message : 'Unable to fetch data',
      },
    };
  }
});

export default CitationHelperPage;
