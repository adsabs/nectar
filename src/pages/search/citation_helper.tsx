import { IADSApiSearchParams, IDocsEntity } from '@/api/search/types';
import { composeNextGSSP } from '@/ssr-utils';
import { SimpleLink } from '@/components/SimpleLink';
import { APP_DEFAULTS, BRAND_NAME_FULL } from '@/config';
import { useBackToSearchResults } from '@/lib/useBackToSearchResults';
import { getFormattedNumericPubdate, unwrapStringValue } from '@/utils/common/formatters';
import { ChevronLeftIcon, ExternalLinkIcon, InfoIcon } from '@chakra-ui/icons';
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
  Tooltip,
} from '@chakra-ui/react';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { parseQueryFromUrl } from '@/utils/common/search';
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { fetchSearch, searchKeys, useSearch } from '@/api/search/search';
import { citationHelperKeys, fetchCitationHelper, useCitationHelper } from '@/api/citation_helper/citation_helper';
import { ICitationHelperParams, ISuggestionEntry } from '@/api/citation_helper/types';
import { logger } from '@/logger';
import { parseAPIError } from '@/utils/common/parseAPIError';
import axios from 'axios';
import { LoadingMessage, StandardAlertMessage } from '@/components/Feedbacks';
import { HideOnPrint } from '@/components/HideOnPrint';
import { useColorModeColors } from '@/lib/useColorModeColors';
import { MathJax } from 'better-react-mathjax';
import { useEffect, useMemo, useState } from 'react';
import { AddToLibraryModal } from '@/components/Libraries';
import { useSession } from '@/lib/useSession';
import { AbstractPreview } from '@/components/ResultList/Item';
import { AuthorList } from '@/components/AllAuthorsModal';
import { getSearchParams } from '@/api/search/models';
import { useVaultBigQuerySearch } from '@/api/vault/vault';
import { SearchQueryLink } from '@/components/SearchQueryLink';
import { ControlledPaginationControls } from '@/components/Pagination';
import { AppState, useStore } from '@/store';
import { NumPerPageType } from '@/types';
import { isNumPerPageType } from '@/utils/common/guards';
import { uniq } from 'ramda';

interface ICitationHelperPageProps {
  query: IADSApiSearchParams;
  bibcodes: string[];
  error?: string;
}

export const CitationHelperPage: NextPage<ICitationHelperPageProps> = ({ query, bibcodes, error }) => {
  const { getSearchHref, show: showSearchHref } = useBackToSearchResults();

  const { isOpen: isAddToLibraryOpen, onClose: onCloseAddToLibrary, onOpen: onOpenAddToLibrary } = useDisclosure();

  const [selectedBibcodes, setSelectedBibcodes] = useState<string[]>([]);

  const { isAuthenticated } = useSession();

  const colors = useColorModeColors();

  const pageSize = useStore((state: AppState) => state.numPerPage);
  const safePageSize = useMemo<NumPerPageType>(() => {
    if (isNumPerPageType(pageSize)) {
      return pageSize;
    }

    return APP_DEFAULTS.RESULT_PER_PAGE;
  }, [pageSize]);

  const setPageSize = useStore((state: AppState) => state.setNumPerPage);

  const [pagination, setPagination] = useState({ entries: 0, pageIndex: 0 });

  // from the input bibcodes, get suggested papers
  const {
    data: suggestions,
    isLoading: isCitationHelperLoading,
    isError: isCitationHelperError,
    error: citationHelperError,
  } = useCitationHelper({ bibcodes: bibcodes }, { enabled: bibcodes.length > 0 });

  // subset of suggestions that are shown
  const shownSuggestions = useMemo<ISuggestionEntry[]>(() => {
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      return [];
    }

    const startIndex = pagination.pageIndex * safePageSize;
    const endIndex = Math.min(startIndex + safePageSize, suggestions.length);

    return suggestions.slice(startIndex, endIndex);
  }, [suggestions, pagination.pageIndex, safePageSize]);

  const currentPageBibcodes = useMemo(() => {
    return shownSuggestions.map((s) => s.bibcode);
  }, [shownSuggestions]);

  // for suggested papers, get paper details
  const {
    data: bigQueryData,
    isFetching: isFetchingBigQuery,
    isError: isBigQueryError,
    error: bigQueryError,
  } = useVaultBigQuerySearch(Array.isArray(suggestions) ? suggestions.map((s) => s.bibcode) : [], {
    enabled: !!suggestions && Array.isArray(suggestions),
  });

  const {
    data: details,
    isFetching: isFetchingDocsDetails,
    isError: isDocsDetailsError,
    error: docsDetailsError,
  } = useSearch(
    getSearchParams({
      q: !!bigQueryData?.qid ? `docs(${bigQueryData.qid})` : '',
      rows: bigQueryData?.numfound ?? 100,
    }),
    {
      enabled: !!bigQueryData?.qid,
    },
  );

  const handleChangePageIndex = (index: number) => {
    setPagination((prev) => ({ ...prev, pageIndex: index }));
  };

  const handleChangePageSize = (size: NumPerPageType) => {
    setPageSize(size);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  useEffect(() => {
    if (!!suggestions && Array.isArray(suggestions)) {
      setPagination((prev) => ({ ...prev, entries: suggestions.length, pageIndex: 0 }));
    }
  }, [suggestions]);

  const handleCloseLibraryModal = (added = false) => {
    if (added) {
      setSelectedBibcodes([]);
    }
    onCloseAddToLibrary();
  };

  return (
    <>
      <Head>
        <title>{`${unwrapStringValue(query?.q)} - ${BRAND_NAME_FULL} Citation Helper`}</title>
      </Head>
      <Flex direction="column">
        <HStack mt={10} mb={4}>
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
          ) : isCitationHelperLoading || isFetchingBigQuery || isFetchingDocsDetails ? (
            <LoadingMessage message="Loading..." />
          ) : isCitationHelperError ? (
            <StandardAlertMessage title={'Error'} description={parseAPIError(citationHelperError)} />
          ) : isBigQueryError ? (
            <StandardAlertMessage title={'Error'} description={parseAPIError(bigQueryError)} />
          ) : isDocsDetailsError ? (
            <StandardAlertMessage title={'Error'} description={parseAPIError(docsDetailsError)} />
          ) : Array.isArray(suggestions) ? (
            <>
              <Text>
                <InfoIcon mr={2} color={colors.brand} />
                {`The citation helper returns up to 100 publications related to your submitted list through citation links, using
          a "friends of friends" network approach, and assigns each a score based on their citation connections`}
              </Text>
              <SearchQueryLink params={{ q: `docs(${bigQueryData.qid})`, sort: ['date desc'] }} newTab my={2}>
                View as search results <ExternalLinkIcon />
              </SearchQueryLink>
              {isAuthenticated && (
                <Stack
                  direction="row"
                  justifyContent={{ md: 'space-between' }}
                  backgroundColor={colors.panel}
                  borderRadius="2px"
                  p={2}
                  my={2}
                >
                  <HStack>
                    <SelectAllCheckbox
                      isAllSelected={currentPageBibcodes.every((b) => selectedBibcodes.includes(b))}
                      isSomeSelected={currentPageBibcodes.some((b) => selectedBibcodes.includes(b))}
                      onChange={(isChecked: boolean) => {
                        if (isChecked) {
                          // add all current page bibcodes to selected
                          setSelectedBibcodes((prev) => uniq([...prev, ...currentPageBibcodes]));
                        } else {
                          // clear all current page bibcodes from selected
                          setSelectedBibcodes((prev) => prev.filter((b) => !currentPageBibcodes.includes(b)));
                        }
                      }}
                    />
                    {selectedBibcodes.length > 0 && (
                      <Stack
                        direction="row"
                        spacing={{ base: '2', md: '5' }}
                        order={{ base: '2', md: '1' }}
                        mt={{ base: '2', md: '0' }}
                        wrap="wrap"
                      >
                        <Text>{`${selectedBibcodes.length} selected`}</Text>
                        <Button variant="link" fontWeight="normal" onClick={() => setSelectedBibcodes([])}>
                          Clear All
                        </Button>
                      </Stack>
                    )}
                  </HStack>
                  <Button onClick={onOpenAddToLibrary} isDisabled={selectedBibcodes.length === 0} width="fit-content">
                    Add to library
                  </Button>
                </Stack>
              )}
              {shownSuggestions.map((e) => (
                <Item
                  entry={e}
                  doc={details.docs.find((d) => d.bibcode === e.bibcode)}
                  key={e.bibcode}
                  showCheckbox={isAuthenticated}
                  isSelected={selectedBibcodes.includes(e.bibcode)}
                  setSelected={(s) => {
                    if (s) {
                      setSelectedBibcodes((prev) => uniq([...prev, e.bibcode]));
                    } else {
                      setSelectedBibcodes((prev) => prev.filter((b) => b !== e.bibcode));
                    }
                  }}
                />
              ))}
              <ControlledPaginationControls
                entries={pagination.entries}
                pageIndex={pagination.pageIndex}
                pageSize={safePageSize}
                onChangePageSize={handleChangePageSize}
                onChangePageIndex={handleChangePageIndex}
              />
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
      <AddToLibraryModal isOpen={isAddToLibraryOpen} onClose={handleCloseLibraryModal} bibcodes={selectedBibcodes} />
    </>
  );
};

export const Item = ({
  entry,
  doc,
  isSelected = false,
  setSelected,
  showCheckbox,
}: {
  entry: ISuggestionEntry;
  doc: IDocsEntity;
  isSelected: boolean;
  setSelected: (selected: boolean) => void;
  showCheckbox: boolean;
}) => {
  const { bibcode, title, score } = entry;
  const encodedCanonicalID = bibcode ? encodeURIComponent(bibcode) : '';

  const { author_count, author = [], pubdate, pub, citation_count } = doc;

  const formattedPubDate = getFormattedNumericPubdate(pubdate);

  const truncatedPub =
    pub?.length > APP_DEFAULTS.RESULT_ITEM_PUB_CUTOFF ? pub.slice(0, APP_DEFAULTS.RESULT_ITEM_PUB_CUTOFF) + '...' : pub;

  const colors = useColorModeColors();

  const cite =
    typeof citation_count === 'number' && citation_count > 0 ? (
      <SimpleLink href={{ pathname: `/abs/${encodedCanonicalID}/citations`, search: 'p=1' }}>
        cited: {citation_count}
      </SimpleLink>
    ) : null;

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
      <Stack direction="column" width="full" spacing={0} mx={3} mt={2}>
        <Flex justifyContent="space-between">
          <SimpleLink href={`/abs/${encodedCanonicalID}/abstract`} fontWeight="semibold">
            <Text as={MathJax} dangerouslySetInnerHTML={{ __html: unwrapStringValue(title) }} />
          </SimpleLink>
          <Text fontSize="sm">Score: {score}</Text>
        </Flex>
        <Flex direction="column">
          {author_count > 0 && <AuthorList author={author} authorCount={author_count} bibcode={doc.bibcode} />}
          <Flex fontSize="xs" mt={0.5}>
            {formattedPubDate}

            {formattedPubDate && pub ? <Text px="2">·</Text> : ''}
            <Tooltip label={pub} aria-label="publication tooltip" placement="top">
              <span>{truncatedPub}</span>
            </Tooltip>
            {cite && (formattedPubDate || pub) ? <Text px="2">·</Text> : null}
            {cite}
          </Flex>
          <AbstractPreview bibcode={bibcode} />
        </Flex>
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
  const { qid = null, p, ...query } = parseQueryFromUrl<{ qid: string }>(ctx.req.url);

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
