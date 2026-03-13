import { Box, SkeletonText, Text } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { ReactElement } from 'react';

import { truncateDecimal } from '@/utils/common/formatters';
import { useGetSearchStats } from '@/api/search/search';
import { IADSApiSearchParams } from '@/api/search/types';

export interface INumFoundProps {
  count?: number;
  isLoading?: boolean;
}

// pin lower bound to 0, so we don't get negative numbers, and convert to locale string
const sanitizeNum = (num: number): string => {
  return (num < 0 ? 0 : num).toLocaleString();
};

export const NumFound = (props: INumFoundProps): ReactElement => {
  const { count = 0, isLoading } = props;

  if (isLoading) {
    return (
      <Box h={5}>
        <SkeletonText noOfLines={1} w="40" mt="1" skeletonHeight={2} />
      </Box>
    );
  }

  const countString = typeof count === 'number' ? sanitizeNum(count) : '0';

  return (
    <Box h={5}>
      <Text role="status" fontSize="xs">
        Your search returned{' '}
        <Text as="span" fontWeight="bold">
          {countString}
        </Text>{' '}
        results <SortStats />
      </Text>
    </Box>
  );
};

const SortStats = () => {
  const { query: routerQuery } = useRouter();
  const q = typeof routerQuery.q === 'string' ? routerQuery.q : '';
  const sort = Array.isArray(routerQuery.sort)
    ? (routerQuery.sort as IADSApiSearchParams['sort'])
    : typeof routerQuery.sort === 'string'
    ? ([routerQuery.sort] as IADSApiSearchParams['sort'])
    : [];
  const { data, isSuccess } = useGetSearchStats({ q, sort });

  if (isSuccess && 'citation_count' in data.stats_fields) {
    const count = sanitizeNum(data.stats_fields.citation_count.sum);
    return (
      <>
        with{' '}
        <Text as="span" fontWeight="bold" fontSize="xs">
          {count}
        </Text>{' '}
        total citations
      </>
    );
  }

  if (isSuccess && 'citation_count_norm' in data.stats_fields) {
    const count = sanitizeNum(truncateDecimal(data.stats_fields.citation_count_norm.sum, 2));
    return (
      <>
        with{' '}
        <Text as="span" fontWeight="bold" fontSize="xs">
          {count}
        </Text>{' '}
        total normalized citations
      </>
    );
  }

  if (isSuccess && 'credit_count' in data.stats_fields) {
    const count = sanitizeNum(data.stats_fields.credit_count.sum);
    return (
      <>
        with{' '}
        <Text as="span" fontWeight="bold" fontSize="xs">
          {count}
        </Text>{' '}
        total credits
      </>
    );
  }
  return null;
};
