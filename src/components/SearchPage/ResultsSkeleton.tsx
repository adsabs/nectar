'use client';

import { Box, Flex, Stack } from '@chakra-ui/react';

import { ItemsSkeleton } from '@/components/ResultList/ItemsSkeleton';
import { ListActions } from '@/components/ResultList/ListActions';
import { NumFound } from '@/components/NumFound';
import { FacetFilters } from '@/components/SearchFacet/FacetFilters';
import { HideOnPrint } from '@/components/HideOnPrint';
import { SearchFacetsPlaceholder } from '@/components/SearchFacet/SearchFacetsPlaceholder';
import { noop } from '@/utils/common/noop';

export interface IResultsSkeletonProps {
  count: number;
  indexStart?: number;
}

const RESULTS_STACK_SPACING = 10;

export const ResultsSkeleton = ({ count, indexStart = 0 }: IResultsSkeletonProps) => (
  <div data-state="skeleton">
    <Box>
      <Stack direction="column" spacing={RESULTS_STACK_SPACING}>
        <HideOnPrint>
          <NumFound isLoading />
          <Box data-testid="facet-filters-slot">
            <FacetFilters mt="2" />
          </Box>
          <Box />
        </HideOnPrint>
        <Flex direction="row" gap={{ base: 0, lg: 10 }} width="full">
          <SearchFacetsPlaceholder />
          <Box width="full">
            <ListActions isLoading onSortChange={noop} onOpenAddToLibrary={noop} onOpenRemoveFromLibrary={noop} />
            <ItemsSkeleton count={count} indexStart={indexStart} showIndexRail reserveItemHeight />
          </Box>
        </Flex>
      </Stack>
    </Box>
  </div>
);
