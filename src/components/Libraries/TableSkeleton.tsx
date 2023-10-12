import { Stack, Skeleton, LayoutProps } from '@chakra-ui/react';
import { ReactElement } from 'react';

export const TableSkeleton = ({ r, h }: { r: number; h?: LayoutProps['h'] }) => {
  const rows: ReactElement[] = [];
  for (let i = 0; i < r; r++) {
    return <Skeleton h={h} />;
  }

  return <Stack m={5}>{rows}</Stack>;
};
