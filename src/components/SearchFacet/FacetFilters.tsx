import { Box, Heading } from '@chakra-ui/layout';
import { BoxProps, Button, Divider, Tag, TagCloseButton, TagLabel, Tooltip, Wrap, WrapItem } from '@chakra-ui/react';
import { isIADSSearchParams, makeSearchParams, parseQueryFromUrl } from '@utils';
import { useRouter } from 'next/router';
import { curryN } from 'ramda';
import { ReactElement, useCallback, useEffect, useState } from 'react';
import { clearFilters, FilterTuple, getFilters, removeClauseFromFQ } from './helpers';

const PREFIX = 'fq_';

export const FacetFilters = (props: BoxProps): ReactElement => {
  const router = useRouter();
  const [filterSections, setFilterSections] = useState<FilterTuple[]>([]);

  useEffect(() => {
    // Get the current query from the router
    const parsedQuery = parseQueryFromUrl(router.query);

    // parse and generate the filters from the query, and set our sections
    setFilterSections(getFilters(parsedQuery));
  }, [router.query]);

  const handleRemoveFilterClick = useCallback(
    curryN(4, (clause: string, key: string, rawClauses: string[]) => {
      if (typeof key === 'string') {
        // Remove the clause from the current query
        const query = parseQueryFromUrl(router.query);
        const params = removeClauseFromFQ(`${PREFIX}${key}`, clause, rawClauses, query);

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
    const query = parseQueryFromUrl(router.query);
    const params = clearFilters(query);

    if (isIADSSearchParams(params)) {
      const search = makeSearchParams(params);
      void router
        .push({ pathname: router.pathname, search }, null, { scroll: false, shallow: true })
        .then(() => setFilterSections([]));
    }
  };

  if (filterSections.length === 0) {
    return null;
  }

  return (
    <Box {...props} mb="2">
      <Heading as="h2" fontSize="sm" mb="2">
        Applied Filters
      </Heading>
      <Divider />
      {filterSections.map(([label, cleanClauses, rawClauses]) => (
        <Wrap aria-labelledby={`${label} applied filters`} spacing="0.5">
          <WrapItem alignItems="center">
            <Heading as="h3" fontSize="sm" id={`${label} applied filters`}>
              {label}:
            </Heading>
          </WrapItem>
          {cleanClauses.map((clause, index) => (
            <WrapItem>
              <Tag size="sm" my="0.5" fontSize="sm" maxWidth="200">
                <TagLabel isTruncated noOfLines={1}>
                  <Tooltip label={clause}>{clause}</Tooltip>
                </TagLabel>
                <TagCloseButton
                  data-value={clause}
                  data-section={label}
                  onClick={handleRemoveFilterClick(rawClauses[index], label, rawClauses)}
                />
              </Tag>
            </WrapItem>
          ))}
        </Wrap>
      ))}
      <Button variant="link" fontSize="xs" onClick={handleRemoveAllFiltersClick}>
        Remove all
      </Button>
    </Box>
  );
};
