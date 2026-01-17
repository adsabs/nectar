import { Alert, AlertIcon, Box, Button, Flex, Heading, Spinner, Center, Text } from '@chakra-ui/react';
import { ArrowLeftIcon } from '@chakra-ui/icons';

import { APP_DEFAULTS, BRAND_NAME_FULL } from '@/config';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { last } from 'ramda';
import { useCallback, useMemo, useState } from 'react';
import { useSettings } from '@/lib/useSettings';
import { useBackToSearchResults } from '@/lib/useBackToSearchResults';
import { SimpleLink } from '@/components/SimpleLink';
import { CitationExporter } from '@/components/CitationExporter';
import { JournalFormatMap } from '@/components/Settings';
import { unwrapStringValue } from '@/utils/common/formatters';
import { ExportApiFormatKey, ExportApiJournalFormat } from '@/api/export/types';
import { IADSApiSearchParams } from '@/api/search/types';
import { useSearchInfinite } from '@/api/search/search';
import { useExportFormats } from '@/lib/useExportFormats';
import { parseQueryFromUrl } from '@/utils/common/search';
import { composeNextGSSP } from '@/ssr-utils';

const ExportCitationPage: NextPage = () => {
  const router = useRouter();
  const { isValidFormat } = useExportFormats();

  // Get export related user settings for defaults
  const { settings } = useSettings({ suspense: false });

  // Wait for router to be ready before accessing query params
  if (!router.isReady) {
    return (
      <Center h="200px">
        <Spinner size="xl" />
      </Center>
    );
  }

  // Extract format from URL path
  const pathFormat = router.query.format as string;

  // Validate format - support manifest formats and 'custom'
  const validFormat =
    isValidFormat(pathFormat) || pathFormat === ExportApiFormatKey.custom ? pathFormat : ExportApiFormatKey.bibtex;

  // User settings as defaults based on format
  const userDefaults =
    validFormat === ExportApiFormatKey.bibtexabs
      ? {
          keyformat: settings.bibtexABSKeyFormat,
          journalformat: JournalFormatMap[settings.bibtexJournalFormat],
          authorcutoff: parseInt(settings.bibtexABSAuthorCutoff),
          maxauthor: parseInt(settings.bibtexABSMaxAuthors),
        }
      : {
          keyformat: settings.bibtexKeyFormat,
          journalformat: JournalFormatMap[settings.bibtexJournalFormat],
          authorcutoff: parseInt(settings.bibtexAuthorCutoff),
          maxauthor: parseInt(settings.bibtexMaxAuthors),
        };

  // Parse URL params - these override user defaults
  const urlCustomFormat = router.query.customFormat as string | undefined;
  const urlKeyformat = router.query.keyformat as string | undefined;
  const urlJournalformat = router.query.journalformat
    ? (parseInt(router.query.journalformat as string, 10) as ExportApiJournalFormat)
    : undefined;
  const urlAuthorcutoff = router.query.authorcutoff ? parseInt(router.query.authorcutoff as string, 10) : undefined;
  const urlMaxauthor = router.query.maxauthor ? parseInt(router.query.maxauthor as string, 10) : undefined;

  return (
    <ExportCitationPageContent
      format={validFormat}
      customFormat={urlCustomFormat}
      keyformat={urlKeyformat ?? userDefaults.keyformat}
      journalformat={urlJournalformat ?? userDefaults.journalformat}
      authorcutoff={urlAuthorcutoff ?? userDefaults.authorcutoff}
      maxauthor={urlMaxauthor ?? userDefaults.maxauthor}
    />
  );
};

interface ExportCitationPageContentProps {
  format: string;
  customFormat?: string;
  keyformat: string;
  journalformat: ExportApiJournalFormat;
  authorcutoff: number;
  maxauthor: number;
}

const ExportCitationPageContent = ({
  format,
  customFormat,
  keyformat,
  journalformat,
  authorcutoff,
  maxauthor,
}: ExportCitationPageContentProps) => {
  const router = useRouter();

  // Parse search params with sort postfix for cursor pagination
  // Exclude export-specific params so they don't affect the search query key
  const {
    qid,
    referrer,
    customFormat: _customFormat,
    keyformat: _keyformat,
    journalformat: _journalformat,
    authorcutoff: _authorcutoff,
    maxauthor: _maxauthor,
    ...searchQuery
  } = parseQueryFromUrl<{
    qid: string;
    referrer: string;
    customFormat: string;
    keyformat: string;
    journalformat: string;
    authorcutoff: string;
    maxauthor: string;
  }>(router.asPath, { sortPostfix: 'id asc' });

  // Build search query params
  const searchParams: IADSApiSearchParams = {
    rows: APP_DEFAULTS.EXPORT_PAGE_SIZE,
    fl: ['bibcode'],
    sort: searchQuery.sort ?? APP_DEFAULTS.SORT,
    ...(qid ? { q: `docs(${qid})` } : searchQuery),
  };

  const { data, fetchNextPage, hasNextPage, error, isLoading } = useSearchInfinite(searchParams);
  const { getSearchHref, show: showSearchHref } = useBackToSearchResults();

  // Handle submit - update URL with new params
  const handleSubmit = useCallback(
    (params: {
      format: string;
      customFormat: string;
      keyformat: string;
      journalformat: ExportApiJournalFormat;
      authorcutoff: number;
      maxauthor: number;
    }) => {
      // Build new query params, preserving search params
      const newQuery: Record<string, string> = {};

      // Preserve search-related params
      if (router.query.q) {
        newQuery.q = router.query.q as string;
      }
      if (router.query.fq) {
        newQuery.fq = router.query.fq as string;
      }
      if (router.query.fq_database) {
        newQuery.fq_database = router.query.fq_database as string;
      }
      if (router.query.sort) {
        newQuery.sort = Array.isArray(router.query.sort) ? router.query.sort.join(',') : router.query.sort;
      }
      if (router.query.p) {
        newQuery.p = router.query.p as string;
      }
      if (router.query.d) {
        newQuery.d = router.query.d as string;
      }
      if (router.query.qid) {
        newQuery.qid = router.query.qid as string;
      }
      if (router.query.referrer) {
        newQuery.referrer = router.query.referrer as string;
      }

      // Add export params
      if (params.customFormat && params.customFormat !== '%1H:%Y:%q') {
        newQuery.customFormat = params.customFormat;
      }
      if (params.keyformat && params.keyformat !== '%R') {
        newQuery.keyformat = params.keyformat;
      }
      if (params.journalformat !== ExportApiJournalFormat.AASTeXMacros) {
        newQuery.journalformat = String(params.journalformat);
      }
      if (params.authorcutoff !== APP_DEFAULTS.BIBTEX_DEFAULT_AUTHOR_CUTOFF) {
        newQuery.authorcutoff = String(params.authorcutoff);
      }
      if (params.maxauthor !== 0) {
        newQuery.maxauthor = String(params.maxauthor);
      }

      void router.push(
        {
          pathname: `/search/exportcitation/${params.format}`,
          query: newQuery,
        },
        undefined,
        { shallow: true },
      );
    },
    [router],
  );

  // Track which page of loaded data to display
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Accumulate all records from all loaded pages
  const allRecords = useMemo(() => {
    if (!data?.pages) {
      return [];
    }
    return data.pages.flatMap((page) => page.response.docs.map((d) => d.bibcode));
  }, [data?.pages]);

  // Get records for the current page view
  const currentPageRecords = useMemo(() => {
    const start = currentPageIndex * APP_DEFAULTS.EXPORT_PAGE_SIZE;
    const end = start + APP_DEFAULTS.EXPORT_PAGE_SIZE;
    return allRecords.slice(start, end);
  }, [allRecords, currentPageIndex]);

  // Derived pagination state
  const totalLoadedPages = data?.pages?.length ?? 0;
  const hasPrevPage = currentPageIndex > 0;
  const hasNextLoadedPage = currentPageIndex < totalLoadedPages - 1;

  const handlePrevPage = useCallback(() => {
    setCurrentPageIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    if (hasNextLoadedPage) {
      // Navigate to next already-loaded page
      setCurrentPageIndex((prev) => prev + 1);
    } else if (hasNextPage) {
      // Load more records and navigate to that page
      void fetchNextPage().then(() => {
        setCurrentPageIndex((prev) => prev + 1);
      });
    }
  }, [hasNextLoadedPage, hasNextPage, fetchNextPage]);

  // Only show full page spinner on initial load, not on refetches
  if (isLoading && !data) {
    return (
      <Center h="200px">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (error) {
    return (
      <Flex direction="column" pt={10}>
        <Box mb={6}>
          <Heading as="h2" fontSize="2xl">
            Export Citations
          </Heading>
        </Box>
        <Alert status="error">
          <AlertIcon />
          {error.message}
        </Alert>
      </Flex>
    );
  }

  if (!data) {
    return null;
  }

  const numFound = last(data.pages).response.numFound;

  return (
    <>
      <Head>
        <title>{`${unwrapStringValue(searchParams?.q)} - ${BRAND_NAME_FULL} Export Citations`}</title>
      </Head>
      <Flex direction="column" pt={10}>
        {(referrer || showSearchHref) && (
          <Button
            as={SimpleLink}
            variant="link"
            size="sm"
            leftIcon={<ArrowLeftIcon />}
            alignSelf="flex-start"
            href={referrer ?? getSearchHref()}
            mb={4}
          >
            Return to search results
          </Button>
        )}

        <Box mb={6}>
          <Heading as="h2" fontSize="2xl">
            Export Citations
          </Heading>
          <Text color="gray.600" fontSize="sm" mt={1}>
            {numFound.toLocaleString()} records available
          </Text>
        </Box>

        <Box>
          <CitationExporter
            format={format}
            customFormat={customFormat}
            keyformat={keyformat}
            journalformat={journalformat}
            maxauthor={maxauthor}
            authorcutoff={authorcutoff}
            records={currentPageRecords}
            totalRecords={numFound}
            onNextPage={handleNextPage}
            onPrevPage={handlePrevPage}
            hasNextPage={hasNextLoadedPage || hasNextPage}
            hasPrevPage={hasPrevPage}
            page={currentPageIndex}
            sort={searchParams.sort}
            onExportSubmit={handleSubmit}
          />
        </Box>
      </Flex>
    </>
  );
};

export default ExportCitationPage;

// Enable server-side session to inject user data for authentication
export const getServerSideProps: GetServerSideProps = composeNextGSSP();
