import { BoxProps, Button, Flex, Tag, TagCloseButton, TagLabel, Tooltip, VisuallyHidden } from '@chakra-ui/react';
import { clearFQs, removeFQClause } from '@query-utils';
import { isIADSSearchParams, makeSearchParams, parseQueryFromUrl } from '@utils';
import { useRouter } from 'next/router';
import { curryN } from 'ramda';
import { ReactElement, useCallback, useEffect, useState } from 'react';
import { FilterTuple, getFilters } from './helpers';

export const FacetFilters = (props: BoxProps): ReactElement => {
  const router = useRouter();
  const [filterSections, setFilterSections] = useState<FilterTuple[]>([]);

  useEffect(() => {
    // Get the current query from the router
    const parsedQuery = parseQueryFromUrl(router.asPath);

    // parse and generate the filters from the query, and set our sections
    setFilterSections(getFilters(parsedQuery));
  }, [router.query]);

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
    <Flex {...props} mb="2" gap={2} wrap="wrap">
      <VisuallyHidden as="h2">Applied Filters</VisuallyHidden>
      {filterSections.map(([label, cleanClauses, rawClauses]) => (
        <Flex key={label} gap={2} wrap="wrap">
          {cleanClauses.map((clause, index) => (
            <Tag size="sm" my="0.5" fontSize="sm" maxWidth="200" key={clause}>
              <TagLabel isTruncated noOfLines={1}>
                <Tooltip label={`${label} - ${clause}`}>{clause}</Tooltip>
              </TagLabel>
              <TagCloseButton
                data-value={clause}
                data-section={label}
                onClick={handleRemoveFilterClick(rawClauses[index], label)}
              />
            </Tag>
          ))}
        </Flex>
      ))}
      <Button variant="link" fontSize="xs" onClick={handleRemoveAllFiltersClick}>
        Remove all
      </Button>
    </Flex>
  );
};
