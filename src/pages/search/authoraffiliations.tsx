import { authorAffiliationsKeys, fetchAuthorAffiliationSearch } from '@/api/author-affiliation/author-affiliation';
import { getAuthorAffiliationSearchParams } from '@/api/author-affiliation/model';
import { IAuthorAffiliationPayload } from '@/api/author-affiliation/types';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { Button, Container as Box } from '@chakra-ui/react';

import { APP_DEFAULTS } from '@/config';
import { useBackToSearchResults } from '@/lib/useBackToSearchResults';
import { composeNextGSSP } from '@/ssr-utils';
import { NextPage } from 'next';
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { logger } from '@/logger';
import { AuthorAffiliations, AuthorAffiliationsErrorMessage } from '@/components/AuthorAffiliations';
import { SimpleLink } from '@/components/SimpleLink';
import { parseQueryFromUrl } from '@/utils/common/search';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { IADSApiSearchParams } from '@/api/search/types';
import { fetchSearchInfinite, searchKeys } from '@/api/search/search';

interface IAuthorAffilationsPageProps {
  error?: string;
  query?: IADSApiSearchParams;
  params?: IAuthorAffiliationPayload;
}

const AuthorAffiliationsPage: NextPage<IAuthorAffilationsPageProps> = (props) => {
  const { error, query, params } = props;
  const { getSearchHref, show: showBackLink } = useBackToSearchResults();

  if (error) {
    return <AuthorAffiliationsErrorMessage error={new Error(error)} />;
  }

  return (
    <>
      {showBackLink && (
        <Button as={SimpleLink} href={getSearchHref()} variant={'outline'} leftIcon={<ChevronLeftIcon />} mt="4">
          Back to Results
        </Button>
      )}

      <Box as="section" maxW="container.xl" mt={showBackLink ? 0 : 4} mb="4" centerContent>
        <AuthorAffiliations params={params} query={query} w="full" maxW="container.lg" />
      </Box>
    </>
  );
};

export default AuthorAffiliationsPage;

export const getServerSideProps = composeNextGSSP(async (ctx) => {
  const {
    qid = null,
    p,
    format,
    ...query
  } = parseQueryFromUrl<{ qid: string; format: string }>(ctx.req.url, { sortPostfix: 'id asc' });

  if (!query && !qid) {
    return {
      props: {
        error: 'No Records',
      },
    };
  }

  const queryClient = new QueryClient();
  const params: IADSApiSearchParams = {
    rows: APP_DEFAULTS.AUTHOR_AFF_SEARCH_SIZE,
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

    const authorAffiliationParams = getAuthorAffiliationSearchParams({
      bibcode: data.pages[0].response.docs.map((d) => d.bibcode),
    });
    void (await queryClient.fetchQuery({
      queryKey: authorAffiliationsKeys.search(authorAffiliationParams),
      queryFn: fetchAuthorAffiliationSearch,
      meta: { params: authorAffiliationParams },
    }));

    // react-query infinite queries cannot be serialized by next, currently.
    // see https://github.com/tannerlinsley/react-query/issues/3301#issuecomment-1041374043

    const dehydratedState = JSON.parse(JSON.stringify(dehydrate(queryClient)));

    return {
      props: {
        params: authorAffiliationParams,
        query: params,
        dehydratedState,
      },
    };
  } catch (error) {
    logger.error({ msg: 'GSSP error on author affiliations form', error });
    return {
      props: {
        query: params,
        error: parseAPIError(error),
      },
    };
  }
});
