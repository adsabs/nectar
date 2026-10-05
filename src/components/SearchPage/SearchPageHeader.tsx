'use client';

import { FormEventHandler } from 'react';
import { Flex } from '@chakra-ui/react';
import { omit } from 'ramda';

import { useStore, useStoreApi } from '@/store';
import { useRouterCompat } from '@/lib/useRouterCompat';
import { usePreferredSearchSort } from '@/lib/usePreferredSearchSort';
import { useSearchMode } from '@/lib/useSearchMode';
import { clientSearchIdentityInputs, searchIdentity } from '@/lib/searchIdentity';
import { getDefaultSortForQuery, makeSearchParams } from '@/utils/common/search';
import { ADS_COMPAT_URL_PARAM, buildSearchOutgoing } from '@/utils/common/searchMode';
import { IADSApiSearchParams } from '@/api/search/types';
import { HideOnPrint } from '@/components/HideOnPrint';
import { SearchBar } from '@/components/SearchBar';

export const SearchPageHeader = () => {
  const router = useRouterCompat();
  const store = useStoreApi();

  const appMode = useStore((state) => state.mode);
  const storeNumPerPage = useStore((state) => state.numPerPage);
  const clearAllSelected = useStore((state) => state.clearAllSelected);

  const preferredSearchSort = usePreferredSearchSort();
  const [searchMode] = useSearchMode();

  const { params } = searchIdentity(
    clientSearchIdentityInputs({
      asPath: router.asPath,
      mode: appMode,
      numPerPage: storeNumPerPage,
      preferredSearchSort,
    }),
  );

  const handleOnSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get('q') as string;

    const query = store.getState().query;
    if (q.length === 0) {
      return;
    }

    clearAllSelected();

    const overriddenSort = getDefaultSortForQuery(q, params.sort);
    const base = omit([ADS_COMPAT_URL_PARAM, 'd'], {
      ...params,
      ...query,
      q,
      sort: overriddenSort,
      p: 1,
    }) as IADSApiSearchParams;
    const search = makeSearchParams(buildSearchOutgoing(base, searchMode));
    router.push(search ? `${router.pathname}?${search}` : router.pathname, { scroll: false, shallow: true });
  };

  const initialQuery = router.searchParams.get('q') ?? undefined;

  return (
    <HideOnPrint pt={10}>
      <form method="get" action="/search" onSubmit={handleOnSubmit}>
        <Flex direction="column" width="full">
          <SearchBar query={initialQuery} showBackLinkAs="new_search" />
        </Flex>
      </form>
    </HideOnPrint>
  );
};
