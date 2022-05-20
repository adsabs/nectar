import { useGetSearchStats } from '@api';
import { Text } from '@chakra-ui/layout';
import { SkeletonText } from '@chakra-ui/react';
import { useStore } from '@store';
import { truncateDecimal } from '@utils';
import { ReactElement } from 'react';

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
    return <SkeletonText noOfLines={1} w="40" mt="1" />;
  }

  const countString = typeof count === 'number' ? sanitizeNum(count) : '0';

  return (
    <Text role="status" fontSize="xs">
      Your search returned{' '}
      <Text as="span" fontWeight="bold">
        {countString}
      </Text>{' '}
      results <SortStats />
    </Text>
  );
};

const SortStats = () => {
  const latestQuery = useStore((state) => state.latestQuery);
  const { data, isSuccess } = useGetSearchStats(latestQuery);

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
  return null;
};
