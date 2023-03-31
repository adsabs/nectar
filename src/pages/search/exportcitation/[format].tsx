import {
  ExportApiFormatKey,
  exportCitationKeys,
  fetchExportCitation,
  fetchSearchInfinite,
  IADSApiSearchParams,
  isExportApiFormat,
  searchKeys,
  useSearchInfinite,
} from '@api';
import { Alert, AlertIcon } from '@chakra-ui/alert';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { Box, Flex, Heading, HStack, Link } from '@chakra-ui/react';
import { CitationExporter } from '@components';
import { getExportCitationDefaultContext } from '@components/CitationExporter/CitationExporter.machine';
import { APP_DEFAULTS } from '@config';
import { useIsClient } from '@hooks/useIsClient';
import { parseQueryFromUrl } from '@utils';
import axios from 'axios';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { last, omit } from 'ramda';
import { dehydrate, DehydratedState, QueryClient } from 'react-query';
import { composeNextGSSP } from '@ssrUtils';

interface IExportCitationPageProps {
  format: ExportApiFormatKey;
  query: IADSApiSearchParams;
  error?: {
    status?: string;
    message?: string;
  };
}

const ExportCitationPage: NextPage<IExportCitationPageProps> = (props) => {
  const { format, query, error } = props;
  const isClient = useIsClient();
  const router = useRouter();

  const { data, fetchNextPage, hasNextPage } = useSearchInfinite(query);

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
        <title>NASA Science Explorer - Export Citations</title>
      </Head>
      <Flex direction="column">
        <HStack my={10}>
          <NextLink
            href={{ pathname: '/search', query: omit(['qid', 'format'], router.query) }}
            passHref
            legacyBehavior
          >
            <Link aria-label="Back to search results">
              <ChevronLeftIcon w={8} h={8} />
            </Link>
          </NextLink>
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
    ...query
  } = parseQueryFromUrl<{ qid: string; format: string }>(ctx.req.url, { sortPostfix: 'id asc' });

  if (!query && !qid) {
    return {
      props: {
        format,
        query,
        qid,
        error: 'No Records',
      },
    };
  }

  const queryClient = new QueryClient();

  try {
    const params: IADSApiSearchParams = {
      rows: APP_DEFAULTS.EXPORT_PAGE_SIZE,
      fl: ['bibcode'],
      sort: APP_DEFAULTS.SORT,
      ...(qid ? { q: `docs(${qid})`, sort: ['id asc'] } : query),
    };

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const dehydratedState: DehydratedState = JSON.parse(JSON.stringify(dehydrate(queryClient)));

    return {
      props: {
        format: exportParams.format,
        query: params,
        dehydratedState,
      },
    };
  } catch (e) {
    return {
      props: {
        error: axios.isAxiosError(e) ? e.message : 'Unable to fetch data',
      },
    };
  }
});

export default ExportCitationPage;
