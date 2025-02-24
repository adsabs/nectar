import { Alert, AlertIcon, Box, Flex, Heading, HStack } from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';

import { getExportCitationDefaultContext } from '@/components/CitationExporter/CitationExporter.machine';
import { APP_DEFAULTS, BRAND_NAME_FULL } from '@/config';
import { useIsClient } from '@/lib/useIsClient';
import axios from 'axios';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { last } from 'ramda';
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { composeNextGSSP } from '@/ssr-utils';
import { useSettings } from '@/lib/useSettings';
import { useBackToSearchResults } from '@/lib/useBackToSearchResults';
import { logger } from '@/logger';
import { SimpleLink } from '@/components/SimpleLink';
import { CitationExporter } from '@/components/CitationExporter';
import { JournalFormatMap } from '@/components/Settings';
import { parseQueryFromUrl } from '@/utils/common/search';
import { unwrapStringValue } from '@/utils/common/formatters';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { ExportApiFormatKey, isExportApiFormat } from '@/api/export/types';
import { IADSApiSearchParams } from '@/api/search/types';
import { fetchSearchInfinite, searchKeys, useSearchInfinite } from '@/api/search/search';
import { exportCitationKeys, fetchExportCitation } from '@/api/export/export';

interface IExportCitationPageProps {
  format: ExportApiFormatKey;
  query: IADSApiSearchParams;
  referrer?: string;
  error?: {
    status?: string;
    message?: string;
  };
}

const ExportCitationPage: NextPage<IExportCitationPageProps> = (props) => {
  const { format, query, referrer } = props;
  const isClient = useIsClient();

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

  const { data, fetchNextPage, hasNextPage, error } = useSearchInfinite(query);
  const { getSearchHref } = useBackToSearchResults();

  // TODO: add more error handling here
  if (!data) {
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
          <SimpleLink href={referrer ?? getSearchHref()}>
            <ChevronLeftIcon w={8} h={8} />
          </SimpleLink>
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
          ) : isClient ? (
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
          ) : (
            <CitationExporter.Static
              initialFormat={format}
              records={records}
              totalRecords={numFound}
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
    p,
    format,
    referrer = null,
    ...query
  } = parseQueryFromUrl<{ qid: string; format: string }>(ctx.req.url, { sortPostfix: 'id asc' });

  if (!query && !qid) {
    return {
      props: {
        format,
        query,
        qid,
        referrer,
        error: 'No Records',
      },
    };
  }

  const queryClient = new QueryClient();
  const params: IADSApiSearchParams = {
    rows: APP_DEFAULTS.EXPORT_PAGE_SIZE,
    fl: ['bibcode'],
    sort: APP_DEFAULTS.SORT,
    ...(qid ? { q: `docs(${qid})`, sort: ['id asc'] } : query),
  };

  try {
    // primary search, this is based on query params
    const data = await queryClient.fetchInfiniteQuery({
      queryKey: searchKeys.infinite(params),
      queryFn: fetchSearchInfinite,
      meta: { params },
    });

    // extract bibcodes to use for export
    const records = data.pages[0].response.docs.map((d) => d.bibcode);

    const { params: exportParams } = getExportCitationDefaultContext({
      format: isExportApiFormat(format) ? format : ExportApiFormatKey.bibtex,
      records,
      singleMode: false,
      sort: params.sort,
    });

    // fetch export string, format is pulled from the url
    void (await queryClient.prefetchQuery({
      queryKey: exportCitationKeys.primary(exportParams),
      queryFn: fetchExportCitation,
      meta: { params: exportParams },
    }));

    // react-query infinite queries cannot be serialized by next, currently.
    // see https://github.com/tannerlinsley/react-query/issues/3301#issuecomment-1041374043

    const dehydratedState = JSON.parse(JSON.stringify(dehydrate(queryClient)));

    return {
      props: {
        format: exportParams.format,
        query: params,
        referrer,
        dehydratedState,
      },
    };
  } catch (error) {
    logger.error({ msg: 'GSSP error in export citation page', error });
    return {
      props: {
        query: params,
        pageError: parseAPIError(error),
        error: axios.isAxiosError(error) ? error.message : 'Unable to fetch data',
      },
    };
  }
});

export default ExportCitationPage;
