import { ISearchMachine } from '@machines/lib/search/types';
import { truncateDecimal } from '@utils';
import { useSelector } from '@xstate/react';
import { ReactElement } from 'react';

export interface INumFoundProps {
  searchService: ISearchMachine;
  count?: number;
}

// pin lower bound to 0, so we don't get negative numbers, and convert to locale string
const sanitizeNum = (num: number): string => {
  return (num < 0 ? 0 : num).toLocaleString();
};

export const NumFound = (props: INumFoundProps): ReactElement => {
  const { searchService, count = 0 } = props;

  const citationCount = useSelector(searchService, (state) => {
    const userSort = state.context.params.sort[0].split(' ')[0];
    return userSort === 'citation_count' && state.context.result.stats?.stats_fields?.citation_count?.sum
      ? state.context.result.stats.stats_fields.citation_count.sum
      : null;
  });

  const normCitationCount = useSelector(searchService, (state) => {
    const userSort = state.context.params.sort[0].split(' ')[0];
    return userSort === 'citation_count_norm' && state.context.result.stats?.stats_fields?.citation_count_norm?.sum
      ? truncateDecimal(state.context.result.stats.stats_fields.citation_count_norm.sum, 1)
      : null;
  });

  const countString = typeof count === 'number' ? sanitizeNum(count) : '0';
  const citationsString =
    typeof citationCount === 'number' ? (
      <>
        {' '}
        with <span className="font-bold">{sanitizeNum(citationCount)}</span> total citations
      </>
    ) : null;
  const normalizedCitationsString =
    typeof normCitationCount === 'number' ? (
      <>
        {' '}
        with <span className="font-bold">{sanitizeNum(normCitationCount)}</span> total normalized citations
      </>
    ) : null;

  return (
    <p role="status" className="mt-1 text-xs">
      Your search returned <span className="font-bold">{countString}</span> results{citationsString}
      {normalizedCitationsString}
    </p>
  );
};
