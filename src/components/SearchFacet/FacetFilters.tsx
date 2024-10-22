import { Box, BoxProps, Button, Flex, Tag, TagCloseButton, TagLabel, Tooltip } from '@chakra-ui/react';
import { clearFQs, removeFQClause } from '@/query-utils';
import { useRouter } from 'next/router';
import { curryN } from 'ramda';
import { ReactElement, useCallback, useEffect, useState } from 'react';
import { FilterTuple, getFilters, getObjectName } from './helpers';

import { useQueryClient } from '@tanstack/react-query';
import { isIADSSearchParams } from '@/utils/common/guards';
import { makeSearchParams, parseQueryFromUrl } from '@/utils/common/search';
import { useObjects } from '@/api/objects/objects';

export const FacetFilters = (props: BoxProps): ReactElement => {
  const router = useRouter();
  const [filterSections, setFilterSections] = useState<FilterTuple[]>([]);

  const [objectIds, setObjectIds] = useState<string[]>([]);

  const { data: objects } = useObjects({ identifiers: objectIds }, { enabled: objectIds && objectIds.length > 0 });

  const queryClient = useQueryClient();

  // look up in the cache for matching object id in the react query key
  // if found, get data from cache, otherwise fetch
  const translateObjectClauses = (clauses: string[]) => {
    const objectIds: string[] = [];
    return clauses.map((clause) => {
      let translatedClause = clause;
      clause.split(/(AND|OR|NOT)/).forEach((c) => {
        if (c.indexOf('/') > -1) {
          const id = c.split('/')[1].trim();
          // replace id with name if found, otherwise gather the ids be queried
          const objectName = getObjectName(id, queryClient);
          if (!!objectName) {
            translatedClause = translatedClause.replace(`/${id}`, `/${objectName}`);
          } else {
            objectIds.push(id);
          }
        }
      });
      if (objectIds.length > 0) {
        setObjectIds(objectIds);
      }
      return translatedClause;
    });
  };

  useEffect(() => {
    // Get the current query from the router
    const parsedQuery = parseQueryFromUrl(router.asPath);

    // parse and generate the filters from the query, and set our sections
    const filters = getFilters(parsedQuery).map((tuple) => {
      const [label, cleanClauses, rawClauses] = tuple;
      if (label === 'simbad') {
        return [label, translateObjectClauses(cleanClauses), rawClauses] as FilterTuple;
      } else {
        return tuple;
      }
    });
    setFilterSections(filters);
  }, [router.query, objects]);

  const handleRemoveFilterClick = useCallback(
    curryN(3, (clause: string, key: string) => {
      if (typeof key === 'string') {
        // Remove the clause from the current query
        const query = parseQueryFromUrl(router.asPath);
        const params = removeFQClause(key, clause, query);

        // Update the router with the new query
        if (isIADSSearchParams(params)) {
          const search = makeSearchParams(params);
          void router.push({ pathname: router.pathname, search }, null, { scroll: false, shallow: true });
        }
      }
    }),
    [filterSections, router.query],
  );

  const handleRemoveAllFiltersClick = () => {
    const query = parseQueryFromUrl(router.asPath);

    // clear all FQs from the query
    const params = clearFQs(query);

    if (isIADSSearchParams(params)) {
      const search = makeSearchParams(params);
      void router.push({ pathname: router.pathname, search }, null, { scroll: false, shallow: true });
    }
  };

  if (filterSections.length === 0) {
    return null;
  }

  return (
    <Box {...props} my="3">
      <Flex {...props} mb="1" wrap="wrap">
        {filterSections.map(([label, cleanClauses, rawClauses]) => (
          <span key={label}>
            {cleanClauses.map((clause, index) => (
              <Tag key={clause} size="sm" my="0.5" fontSize="sm" maxWidth="200" mr={2}>
                <TagLabel isTruncated noOfLines={1}>
                  <Tooltip label={`${label}: ${clause}`}>{`${label}: ${clause}`}</Tooltip>
                </TagLabel>
                <TagCloseButton
                  data-value={clause}
                  data-section={label}
                  onClick={handleRemoveFilterClick(rawClauses[index], label)}
                />
              </Tag>
            ))}
          </span>
        ))}
      </Flex>
      <Button variant="link" fontSize="xs" onClick={handleRemoveAllFiltersClick}>
        Remove all filters
      </Button>
    </Box>
  );
};
