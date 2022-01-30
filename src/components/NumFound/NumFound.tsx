import { useStore } from '@store';
import { truncateDecimal } from '@utils';
import { useGetSearchStats } from '@_api/search';
import { ReactElement } from 'react';

export interface INumFoundProps {
  count?: number;
}

// pin lower bound to 0, so we don't get negative numbers, and convert to locale string
const sanitizeNum = (num: number): string => {
  return (num < 0 ? 0 : num).toLocaleString();
};

export const NumFound = (props: INumFoundProps): ReactElement => {
  const { count = 0 } = props;

  const countString = typeof count === 'number' ? sanitizeNum(count) : '0';

  return (
    <p role="status" className="mt-1 text-xs">
      Your search returned <span className="font-bold">{countString}</span> results <SortStats />
    </p>
  );
};

const SortStats = () => {
  const latestQuery = useStore((state) => state.latestQuery);
  const { data, isSuccess } = useGetSearchStats(latestQuery);

  if (isSuccess && 'citation_count' in data.stats_fields) {
    const count = sanitizeNum(data.stats_fields.citation_count.sum);
    return (
      <>
        with <span className="font-bold">{count}</span> total citations
      </>
    );
  }

  if (isSuccess && 'citation_count_norm' in data.stats_fields) {
    const count = sanitizeNum(truncateDecimal(data.stats_fields.citation_count_norm.sum, 2));
    return (
      <>
        with <span className="font-bold">{count}</span> total normalized citations
      </>
    );
  }
  return null;
};
