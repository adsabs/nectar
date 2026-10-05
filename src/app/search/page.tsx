import { Suspense } from 'react';
import { cookies, headers } from 'next/headers';
import type { Metadata } from 'next';

import { APP_DEFAULTS, BRAND_NAME_FULL } from '@/config';
import { buildSearchPageTitle } from '@/utils/common/formatters';
import { searchIdentity, serverSearchIdentityInputs } from '@/lib/searchIdentity';
import { readNumPerPagePref } from '@/utils/common/prefs-cookie';
import { fetchInitialSearch } from '@/lib/serverside/fetchInitialSearch';
import { ACCESS_TOKEN_HEADER, resolveServerSession } from '@/lib/serverside/session';
import { SearchPage } from '@/components/SearchPage/SearchPage';
import { SearchPageHeader } from '@/components/SearchPage/SearchPageHeader';
import { ResultsSkeleton } from '@/components/SearchPage/ResultsSkeleton';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

const Results = async ({ searchParams }: { searchParams: SearchParams }) => {
  const headerStore = await headers();
  const store = await cookies();
  const cookieHeader = store.toString();
  const rawSession = store.get(process.env.SCIX_SESSION_COOKIE_NAME)?.value;

  const { token } = await resolveServerSession(rawSession, headerStore.get(ACCESS_TOKEN_HEADER));
  const { searchParams: solrParams } = searchIdentity(serverSearchIdentityInputs({ searchParams, cookieHeader }));

  const result = await fetchInitialSearch({ token, solrParams });

  if (!result) {
    return <SearchPage />;
  }

  return <SearchPage initialData={result.data} initialQueryHash={result.queryHash} />;
};

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const resolved = await searchParams;
  const store = await cookies();
  const cookieHeader = store.toString();
  const { params } = searchIdentity(serverSearchIdentityInputs({ searchParams: resolved, cookieHeader }));

  return {
    title: buildSearchPageTitle(params.q, {
      maxLength: APP_DEFAULTS.SEARCH_TITLE_QUERY_CUTOFF,
      brandName: BRAND_NAME_FULL,
    }),
  };
}

export default async function SearchPageRoute({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolved = await searchParams;
  const store = await cookies();
  const numPerPage = readNumPerPagePref(store.toString());

  return (
    <>
      <SearchPageHeader />
      <Suspense fallback={<ResultsSkeleton count={numPerPage} />}>
        <Results searchParams={resolved} />
      </Suspense>
    </>
  );
}
