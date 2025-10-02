import { Alert, AlertIcon, Box, Flex, Heading, HStack, Skeleton, SkeletonText, VStack } from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';

import { APP_DEFAULTS, BRAND_NAME_FULL } from '@/config';
import { NextPage } from 'next';
import Head from 'next/head';
import { last } from 'ramda';
import { useSettings } from '@/lib/useSettings';
import { useBackToSearchResults } from '@/lib/useBackToSearchResults';
import { SimpleLink } from '@/components/SimpleLink';
import { CitationExporter } from '@/components/CitationExporter';
import { JournalFormatMap } from '@/components/Settings';
import { parseQueryFromUrl } from '@/utils/common/search';
import { unwrapStringValue } from '@/utils/common/formatters';
import { ExportApiFormatKey } from '@/api/export/types';
import { IADSApiSearchParams } from '@/api/search/types';
import { useSearchInfinite } from '@/api/search/search';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

const LoadingSkeleton = () => (
  <Box>
    {/* Top bar with record count and Next button */}
    <Flex justify="space-between" align="center" mb={6}>
      <Skeleton height="24px" width="350px" />
      <Skeleton height="38px" width="110px" borderRadius="md" />
    </Flex>

    {/* Tabs */}
    <Flex mb={6} borderBottomWidth="1px" borderColor="gray.200">
      <Skeleton height="20px" width="130px" mb={3} mr={6} />
      <Skeleton height="20px" width="140px" mb={3} />
    </Flex>

    {/* Main content grid */}
    <Flex gap={8}>
      {/* Left sidebar */}
      <VStack align="stretch" spacing={6} width="570px" flexShrink={0}>
        {/* Format dropdown */}
        <Box>
          <Skeleton height="18px" width="60px" mb={3} />
          <Skeleton height="40px" width="100%" borderRadius="md" />
          <Skeleton height="16px" width="110px" mt={2} />
        </Box>

        {/* Limit Records */}
        <Box>
          <Flex align="center" gap={2} mb={3}>
            <Skeleton height="18px" width="110px" />
            <Skeleton height="16px" width="16px" borderRadius="full" />
          </Flex>
          <Skeleton height="40px" width="100%" borderRadius="md" />
        </Box>

        {/* Submit button */}
        <Skeleton height="44px" width="100%" borderRadius="md" />
      </VStack>

      {/* Right content area */}
      <Box flex="1">
        {/* Action buttons */}
        <Flex justify="flex-end" mb={4} gap={3}>
          <Skeleton height="36px" width="150px" borderRadius="md" />
          <Skeleton height="36px" width="165px" borderRadius="md" />
        </Flex>

        {/* Citation text area */}
        <Box borderWidth="1px" borderRadius="md" p={4} bg="gray.50" minHeight="450px">
          <SkeletonText noOfLines={18} spacing={3} skeletonHeight="3" />
        </Box>
      </Box>
    </Flex>
  </Box>
);

const ExportCitationPage: NextPage = () => {
  const router = useRouter();

  // Parse query params using the same logic as SSR
  const { format, query, referrer, hasQuery } = useMemo(() => {
    if (!router.isReady) {
      return { format: ExportApiFormatKey.bibtex, query: {} as IADSApiSearchParams, hasQuery: false };
    }

    const {
      qid,
      format: formatParam,
      referrer,
      ...rest
    } = parseQueryFromUrl<{
      qid?: string;
      format?: string;
      referrer?: string;
    }>(router.asPath, { sortPostfix: 'id asc' });

    const parsedFormat = typeof formatParam === 'string' ? formatParam : ExportApiFormatKey.bibtex;

    const params: IADSApiSearchParams = {
      rows: APP_DEFAULTS.EXPORT_PAGE_SIZE,
      fl: ['bibcode'],
      sort: rest.sort ?? APP_DEFAULTS.SORT,
      ...(qid ? { q: `docs(${qid})` } : rest),
    };

    return {
      format: parsedFormat,
      query: params,
      referrer,
      hasQuery: !!(qid || rest.q),
    };
  }, [router.isReady, router.asPath]);

  // get export related user settings
  const { settings } = useSettings({
    suspense: false,
  });

  const { keyformat, journalformat, authorcutoff, maxauthor } =
    format === ExportApiFormatKey.bibtexabs
      ? {
          keyformat: settings.bibtexABSKeyFormat,
          journalformat: settings.bibtexJournalFormat,
          authorcutoff: parseInt(settings.bibtexABSAuthorCutoff),
          maxauthor: parseInt(settings.bibtexABSMaxAuthors),
        }
      : {
          keyformat: settings.bibtexKeyFormat,
          journalformat: settings.bibtexJournalFormat,
          authorcutoff: parseInt(settings.bibtexAuthorCutoff),
          maxauthor: parseInt(settings.bibtexMaxAuthors),
        };

  const { data, fetchNextPage, hasNextPage, error } = useSearchInfinite(query, {
    enabled: router.isReady && hasQuery,
  });
  const { getSearchHref, show: showSearchHref } = useBackToSearchResults();

  if (!router.isReady) {
    return (
      <>
        <Head>
          <title>{`${BRAND_NAME_FULL} Export Citations`}</title>
        </Head>
        <Flex direction="column">
          <HStack my={10}>
            <Skeleton height="32px" width="32px" />
            <Skeleton height="32px" width="200px" />
          </HStack>
          <Box pt="1">
            <LoadingSkeleton />
          </Box>
        </Flex>
      </>
    );
  }

  if (!hasQuery) {
    return (
      <Flex direction="column">
        <Alert status="error" mt={10}>
          <AlertIcon />
          No search query or query ID provided
        </Alert>
      </Flex>
    );
  }

  if (!data) {
    return (
      <>
        <Head>
          <title>{`${unwrapStringValue(query?.q)} - ${BRAND_NAME_FULL} Export Citations`}</title>
        </Head>
        <Flex direction="column">
          <HStack my={10}>
            {(referrer || showSearchHref) && <Skeleton height="32px" width="32px" />}
            <Heading as="h2" fontSize="2xl">
              Export Citations
            </Heading>
          </HStack>
          <Box pt="1">
            <LoadingSkeleton />
          </Box>
        </Flex>
      </>
    );
  }

  if (data.pages.length === 0 || !data.pages[0]?.response) {
    return null;
  }

  const res = last(data?.pages).response;
  const records = res.docs.map((d) => d.bibcode);
  const numFound = res.numFound;

  const handleNextPage = () => {
    void fetchNextPage();
  };

  return (
    <>
      <Head>
        <title>{`${unwrapStringValue(query?.q)} - ${BRAND_NAME_FULL} Export Citations`}</title>
      </Head>
      <Flex direction="column">
        <HStack my={10}>
          {(referrer || showSearchHref) && (
            <SimpleLink href={typeof referrer === 'string' ? referrer : getSearchHref()}>
              <ChevronLeftIcon w={8} h={8} />
            </SimpleLink>
          )}

          <Heading as="h2" fontSize="2xl">
            Export Citations
          </Heading>
        </HStack>
        <Box pt="1">
          {error ? (
            <Alert status="error">
              <AlertIcon />
              {error.message}
            </Alert>
          ) : (
            <CitationExporter
              initialFormat={format}
              keyformat={keyformat}
              journalformat={JournalFormatMap[journalformat]}
              maxauthor={maxauthor}
              authorcutoff={authorcutoff}
              records={records}
              totalRecords={numFound}
              nextPage={handleNextPage}
              hasNextPage={hasNextPage}
              page={data.pages.length - 1}
              sort={query.sort}
            />
          )}
        </Box>
      </Flex>
    </>
  );
};

export default ExportCitationPage;
