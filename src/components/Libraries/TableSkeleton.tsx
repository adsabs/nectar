import { LayoutProps, Skeleton, Stack } from '@chakra-ui/react';
import { ReactNode } from 'react';

export const TableSkeleton = ({ r, h }: { r: number; h?: LayoutProps['h'] }) => {
  const rows: ReactNode[] = [];
  for (let i = 0; i < r; i++) {
    rows.push(<Skeleton h={h} key={`skeleton-${i}`} />);
  }

  return <Stack m={5}>{rows}</Stack>;
};
