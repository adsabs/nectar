import { Box, Skeleton, SkeletonText, Stack, VStack } from '@chakra-ui/react';

interface SearchResultsSkeletonProps {
  /** Number of placeholder cards — should match the current rows param */
  rows?: number;
}

/**
 * Placeholder cards that reserve vertical space during search loading.
 * Dimensions match the real Item component so no layout shift occurs on swap.
 */
export const SearchResultsSkeleton = ({ rows = 10 }: SearchResultsSkeletonProps) => {
  return (
    <VStack spacing={0} align="stretch" data-testid="search-results-skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <Box key={i} px={4} py={3} borderBottomWidth="1px">
          <Stack direction="row" align="flex-start" spacing={4}>
            {/* Checkbox placeholder */}
            <Skeleton boxSize="16px" mt={1} flexShrink={0} />
            <Box flex={1}>
              {/* Title */}
              <Skeleton height="18px" width="70%" mb={2} />
              {/* Authors */}
              <Skeleton height="14px" width="50%" mb={2} />
              {/* Bibstem + date */}
              <Skeleton height="12px" width="30%" mb={2} />
              {/* Abstract snippet */}
              <SkeletonText noOfLines={2} spacing={2} skeletonHeight="12px" />
            </Box>
          </Stack>
        </Box>
      ))}
    </VStack>
  );
};
