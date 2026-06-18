import { Alert, AlertIcon, Box, Flex, Heading, HStack } from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';

import { APP_DEFAULTS, BRAND_NAME_FULL } from '@/config';
import axios from 'axios';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { last, map, prop } from 'ramda';
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { composeNextGSSP } from '@/ssr-utils';
import { useSettings } from '@/lib/useSettings';
import { logger } from '@/logger';
import { SimpleLink } from '@/components/SimpleLink';
import { CitationExporter } from '@/components/CitationExporter';
import { ExportSkeleton } from '@/components/CitationExporter/components/ExportSkeleton';
import { JournalFormatMap } from '@/components/Settings';
import { parseQueryFromUrl } from '@/utils/common/search';
import { unwrapStringValue } from '@/utils/common/formatters';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { ExportApiFormatKey } from '@/api/export/types';
import { IADSApiSearchParams } from '@/api/search/types';
import { useSearchInfinite } from '@/api/search/search';
import { exportCitationKeys, fetchExportFormats } from '@/api/export/export';

interface IExportCitationPageProps {
  format: string;
  query: IADSApiSearchParams;
  referrer?: string; // this is currently used by the library
  error?: {
    status?: string;
    message?: string;
  };
}

const ExportCitationPage: NextPage<IExportCitationPageProps> = (props) => {
  const { format, query, referrer, error } = props;
  const router = useRouter();

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

  const { data, fetchNextPage, hasNextPage, isLoading, error: searchError } = useSearchInfinite(query);

  const lastPage = data ? last(data.pages) : null;
  const records = lastPage ? lastPage.response.docs.map((d) => d.bibcode) : [];
  const numFound = lastPage ? lastPage.response.numFound : 0;

  const handleNextPage = () => {
    void fetchNextPage();
  };

  const errorMessage = error?.message ?? (searchError instanceof Error ? searchError.message : undefined);

  return (
    <>
      <Head>
        <title>{`${unwrapStringValue(query?.q)} - ${BRAND_NAME_FULL} Export Citations`}</title>
      </Head>
      <Flex direction="column">
        <HStack my={10}>
          {referrer ? (
            <SimpleLink href={referrer}>
              <ChevronLeftIcon w={8} h={8} />
            </SimpleLink>
          ) : (
            <button type="button" onClick={() => router.back()} aria-label="Go back">
              <ChevronLeftIcon w={8} h={8} />
            </button>
          )}

          <Heading as="h2" fontSize="2xl">
            Export Citations
          </Heading>
        </HStack>
        <Box pt="1">
          {errorMessage ? (
            <Alert status="error">
              <AlertIcon />
              {errorMessage}
            </Alert>
          ) : isLoading || !data ? (
            <ExportSkeleton />
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
export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx) => {
  const {
    qid = null,
    referrer = null,
    ...query
  } = parseQueryFromUrl<{ qid: string; format: string }>(ctx.req.url, { sortPostfix: 'id asc' });

  const { format } = ctx.params as { format: string };

  const searchParams: IADSApiSearchParams = {
    rows: APP_DEFAULTS.EXPORT_PAGE_SIZE,
    fl: ['bibcode'],
    sort: query.sort ?? APP_DEFAULTS.SORT,
    ...(qid ? { q: `docs(${qid})` } : query),
  };

  const queryClient = new QueryClient();

  try {
    const formatsData = await queryClient.fetchQuery({
      queryKey: exportCitationKeys.manifest(),
      queryFn: fetchExportFormats,
    });

    const formats = map(prop('route'), formatsData).map((r) => r.substring(1));
    const resolvedFormat = formats.includes(format) ? format : ExportApiFormatKey.bibtex;

    return {
      props: {
        format: resolvedFormat,
        query: searchParams,
        referrer,
        dehydratedState: dehydrate(queryClient),
      },
    };
  } catch (error) {
    logger.error({ msg: 'GSSP error in export citation page', error });
    return {
      props: {
        query: searchParams,
        pageError: parseAPIError(error),
        error: axios.isAxiosError(error) ? error.message : 'Unable to fetch data',
      },
    };
  }
});

export default ExportCitationPage;
