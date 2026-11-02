import { Box, Skeleton, SkeletonText, Stack } from '@chakra-ui/react';
import { range } from 'ramda';
import { ReactElement } from 'react';
import { APP_DEFAULTS } from '@/config';

export interface ISkeletonProps {
  count: number;
}

export const ItemsSkeleton = (props: ISkeletonProps): ReactElement => {
  const { count = 0 } = props;
  const visibleCount = Math.min(count, APP_DEFAULTS.RESULT_PER_PAGE);

  return (
    <>
      {range(0, visibleCount).map((i) => (
        <Box
          border="1px"
          borderColor="gray.50"
          margin={2}
          borderRadius="md"
          padding={2}
          key={i.toString()}
          data-testid="results-skeleton-item"
        >
          <Stack direction="column" width="full">
            <Skeleton height={3} width="100%" />
            <Skeleton height={3} width="50%" />
            <SkeletonText width="75%" noOfLines={1} />
            <SkeletonText width="50%" noOfLines={1} />
          </Stack>
        </Box>
      ))}
    </>
  );
};
