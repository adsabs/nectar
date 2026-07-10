import { Box, Flex, Skeleton, SkeletonText, Stack, VisuallyHidden } from '@chakra-ui/react';
import { range } from 'ramda';

import { useColorModeColors } from '@/lib/useColorModeColors';

// Mirrors the loaded AbsLayout: search bar, left sidebar (full text sources +
// side nav) and the main content column. Matching the real structure keeps the
// loading -> loaded transition from shifting layout.
export const AbsRecordSkeleton = () => {
  const colors = useColorModeColors();

  return (
    <Box role="status" aria-live="polite" data-testid="abs-record-skeleton">
      <VisuallyHidden>Loading record…</VisuallyHidden>
      <Stack direction="column" spacing={10}>
        <SearchBarSkeleton />
        <Stack direction={{ base: 'column', lg: 'row' }} spacing={6}>
          <SidebarSkeleton borderColor={colors.border} />
          <MainContentSkeleton borderColor={colors.border} />
        </Stack>
      </Stack>
    </Box>
  );
};

const SearchBarSkeleton = () => (
  <Stack direction="column" spacing={3}>
    <Skeleton height="1rem" width="8rem" />
    <Flex gap={2}>
      <Skeleton height="2.5rem" flex="1" />
      <Skeleton height="2.5rem" width="3rem" />
    </Flex>
  </Stack>
);

const SidebarSkeleton = ({ borderColor }: { borderColor: string }) => (
  <Stack direction="column" spacing={4} display={{ base: 'none', lg: 'flex' }} flexShrink={0} w="72">
    <Stack direction="column" spacing={2}>
      {range(0, 3).map((i) => (
        <Box key={i} borderWidth="1px" borderColor={borderColor} borderRadius="md" px={4} py={3}>
          <Skeleton height="1rem" width="55%" />
        </Box>
      ))}
    </Stack>
    <Stack direction="column" spacing={1} mt={2}>
      {range(0, 10).map((i) => (
        <Flex key={i} align="center" gap={3} px={2} py={2}>
          <Skeleton height="1.25rem" width="1.25rem" borderRadius="sm" />
          <Skeleton height="0.9rem" width={`${45 + ((i * 7) % 35)}%`} />
        </Flex>
      ))}
    </Stack>
  </Stack>
);

const MainContentSkeleton = ({ borderColor }: { borderColor: string }) => (
  <Stack direction="column" spacing={5} width="full">
    <Stack direction="column" spacing={2}>
      <Skeleton height="1.75rem" width="90%" />
      <Skeleton height="1.75rem" width="60%" />
    </Stack>
    <Flex wrap="wrap" gap={2}>
      {range(0, 4).map((i) => (
        <Skeleton key={i} height="1.1rem" width={`${6 + ((i * 3) % 7)}rem`} />
      ))}
    </Flex>
    <Skeleton height="1.5rem" width="5rem" borderRadius="md" />
    <SkeletonText noOfLines={8} spacing={3} skeletonHeight="0.9rem" />
    <DetailsTableSkeleton borderColor={borderColor} />
  </Stack>
);

const DetailsTableSkeleton = ({ borderColor }: { borderColor: string }) => (
  <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" mt={2}>
    {range(0, 6).map((i) => (
      <Flex key={i} gap={6} px={4} py={3} borderBottomWidth={i === 5 ? 0 : '1px'} borderColor={borderColor}>
        <Skeleton height="1rem" width="8rem" flexShrink={0} />
        <Skeleton height="1rem" width={`${30 + ((i * 11) % 45)}%`} />
      </Flex>
    ))}
  </Box>
);
