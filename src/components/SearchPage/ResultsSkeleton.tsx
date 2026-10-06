import { Box, Flex, Skeleton, SkeletonText, Stack } from '@chakra-ui/react';
import { ReactElement } from 'react';

import { ItemsSkeleton } from '@/components/ResultList/ItemsSkeleton';
import { LIST_ACTIONS_HEIGHT, LIST_ACTIONS_HEIGHT_CSS } from '@/components/ResultList/listActionsHeight';
import { NUM_FOUND_HEIGHT } from '@/components/NumFound/numFoundHeight';
import { FacetFilters } from '@/components/SearchFacet/FacetFilters';
import { SearchFacetsPlaceholder } from '@/components/SearchFacet/SearchFacetsPlaceholder';

export interface IResultsSkeletonProps {
  count: number;
}

const RESULTS_STACK_SPACING = 10;
export const LIST_ACTIONS_PLACEHOLDER_HEIGHT = LIST_ACTIONS_HEIGHT;
export const LIST_ACTIONS_PLACEHOLDER_MARGIN = 4;

const ListActionsSkeleton = (): ReactElement => (
  <Flex direction="column" gap={1} height={LIST_ACTIONS_HEIGHT_CSS}>
    <Flex justifyContent="space-between" width="full" gap={1}>
      <Skeleton height={8} width="140px" />
      <Flex gap={1}>
        <Skeleton height={8} width={8} />
        <Skeleton height={8} width={8} />
      </Flex>
    </Flex>
    <Flex justifyContent="space-between" alignItems="center" width="full" p={2}>
      <Skeleton height={5} width="100px" />
      <Flex gap={2}>
        <Skeleton height={10} width="110px" />
        <Skeleton height={10} width="100px" />
      </Flex>
    </Flex>
  </Flex>
);

export const ResultsSkeleton = ({ count }: IResultsSkeletonProps) => (
  <div data-state="skeleton">
    <Stack direction="column" spacing={RESULTS_STACK_SPACING}>
      <Box h={NUM_FOUND_HEIGHT} data-testid="num-found-slot">
        <SkeletonText noOfLines={1} w="40" mt="1" skeletonHeight={2} />
      </Box>
      <Box data-testid="facet-filters-slot">
        <FacetFilters mt="2" />
      </Box>
      <Flex direction="row" gap={{ base: 0, lg: 10 }} width="full">
        <SearchFacetsPlaceholder />
        <Box width="full">
          <ListActionsSkeleton />
          <Box height={`${LIST_ACTIONS_PLACEHOLDER_MARGIN}px`} />
          <ItemsSkeleton count={count} />
        </Box>
      </Flex>
    </Stack>
  </div>
);
