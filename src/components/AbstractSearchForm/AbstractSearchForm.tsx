import { useStore } from '@/store';
import { SearchBar } from '../SearchBar';
import { ChangeEventHandler, useCallback } from 'react';
import { makeSearchParams } from '@/utils/common/search';
import { useSettings } from '@/lib/useSettings';
import { IADSApiSearchParams } from '@/api/search/types';
import router from 'next/router';
import { applyFiltersToQuery } from '../SearchFacet/helpers';
import { DatabaseEnum, IADSApiUserDataResponse } from '@/api/user/types';
import { SolrSort } from '@/api/models';
import { buildSearchOutgoing } from '@/utils/common/searchMode';
import { useSearchMode } from '@/lib/useSearchMode';

export const AbstractSearchForm = () => {
  const { settings } = useSettings();
  const submitQuery = useStore((state) => state.submitQuery);
  const sort = [`${settings.preferredSearchSort} desc` as SolrSort];
  const query = useStore((state) => state.query.q);
  const [searchMode] = useSearchMode();

  const applyDefaultFilters = useCallback(
    (query: IADSApiSearchParams) => {
      const defaultDatabases = getListOfAppliedDefaultDatabases(settings.defaultDatabase);
      if (Array.isArray(defaultDatabases) && defaultDatabases.length > 0) {
        return applyFiltersToQuery({
          query,
          values: defaultDatabases,
          field: 'database',
          logic: 'or',
        });
      }
      return query;
    },
    [settings.defaultDatabase],
  );

  const getListOfAppliedDefaultDatabases = (databases: IADSApiUserDataResponse['defaultDatabase']): Array<string> => {
    const defaultDatabases = [];
    for (const db of databases) {
      if (db.name === DatabaseEnum.All && db.value) {
        return [];
      }
      if (db.value) {
        defaultDatabases.push(db.name);
      }
    }
    return defaultDatabases;
  };

  const handleOnSubmit: ChangeEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      e.preventDefault();
      const query = new FormData(e.currentTarget).get('q') as string;

      if (query && query.trim().length > 0) {
        submitQuery();
        const defaultedQuery = applyDefaultFilters({ q: query, sort, p: 1 }) as IADSApiSearchParams;
        const outgoing = buildSearchOutgoing(defaultedQuery, searchMode);
        void router.push({
          pathname: '/search',
          search: makeSearchParams(outgoing),
        });
      }
    },
    [applyDefaultFilters, searchMode, sort, submitQuery],
  );

  return (
    <form method="get" action="/search" onSubmit={handleOnSubmit}>
      <SearchBar query={query} showBackLinkAs="results" />
    </form>
  );
};
