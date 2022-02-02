import { Text } from '@chakra-ui/layout';
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
    try {
      const userSort = state.context.params.sort[0].split(' ')[0];
      return userSort === 'citation_count' && state.context.result.stats?.stats_fields?.citation_count?.sum
        ? state.context.result.stats.stats_fields.citation_count.sum
        : null;
    } catch (e) {
      return null;
    }
  });

  const normCitationCount = useSelector(searchService, (state) => {
    try {
      const userSort = state.context.params.sort[0].split(' ')[0];
      return userSort === 'citation_count_norm' && state.context.result.stats?.stats_fields?.citation_count_norm?.sum
        ? truncateDecimal(state.context.result.stats.stats_fields.citation_count_norm.sum, 1)
        : null;
    } catch (e) {
      return null;
    }
  });

  const countString = typeof count === 'number' ? sanitizeNum(count) : '0';
  const citationsString =
    typeof citationCount === 'number' ? (
      <>
        {' '}
        with{' '}
        <Text as="span" fontWeight="bold" fontSize="xs">
          {sanitizeNum(citationCount)}
        </Text>{' '}
        total citations
      </>
    ) : null;
  const normalizedCitationsString =
    typeof normCitationCount === 'number' ? (
      <>
        {' '}
        with{' '}
        <Text as="span" fontWeight="bold" fontSize="xs">
          {sanitizeNum(normCitationCount)}
        </Text>{' '}
        total normalized citations
      </>
    ) : null;

  return (
    <Text role="status" fontSize="xs">
      Your search returned{' '}
      <Text as="span" fontWeight="bold">
        {countString}
      </Text>{' '}
      results{citationsString}
      {normalizedCitationsString}
    </Text>
  );
};
