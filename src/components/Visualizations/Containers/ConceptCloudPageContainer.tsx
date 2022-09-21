import { IADSApiSearchParams, useGetWordCloud } from '@api';
import { Box } from '@chakra-ui/react';
import { Expandable, ITagItem, LoadingMessage, SimpleLink, StandardAlertMessage } from '@components';
import axios from 'axios';
import { uniq } from 'ramda';
import { memo, ReactElement, Reducer, useMemo, useReducer } from 'react';
import { WordCloudPane } from '../GraphPanes/WordCloudPane';
import { ISliderRange } from '../types';
import { buildWCDict } from '../utils';
import { FilterSearchBar } from '../Widgets';

const MAX_ROWS_TO_FETCH = 500;

const colorRange = ['#80E6FF', '#7575FF', '#7575FF', '#47008F'];

const sliderRange: ISliderRange = {
  1: [1, 0],
  2: [0.75, 0.25],
  3: [0.5, 0.5],
  4: [0.25, 0.75],
  5: [0, 1],
};

interface IConceptCloudPageState {
  currentSliderValue: number;
  filters: string[];
}

type ConceptCloudPageAction =
  | { type: 'UPDATE_SLIDER_VALUE'; payload: number }
  | { type: 'ADD_FILTER'; payload: string }
  | { type: 'REMOVE_FILTER'; payload: string }
  | { type: 'REMOVE_FILTER_TAG'; payload: ITagItem }
  | { type: 'CLEAR_FILTERS' };

const reducer: Reducer<IConceptCloudPageState, ConceptCloudPageAction> = (state, action) => {
  switch (action.type) {
    case 'UPDATE_SLIDER_VALUE':
      return { ...state, currentSliderValue: action.payload };
    case 'ADD_FILTER':
      return { ...state, filters: uniq([...state.filters, action.payload]) };
    case 'REMOVE_FILTER':
      return { ...state, filters: state.filters.filter((w) => w !== action.payload) };
    case 'CLEAR_FILTERS':
      return { ...state, filters: [] };
    default:
      return state;
  }
};

interface IConceptCloudPageContainerProps {
  query: IADSApiSearchParams;
}

const _ConceptCloudPageContainer = ({ query }: IConceptCloudPageContainerProps): ReactElement => {
  const [state, dispatch] = useReducer(reducer, {
    currentSliderValue: 3,
    filters: [],
  });

  const { data, isLoading, isSuccess, isError, error } = useGetWordCloud(
    { ...query, rows: MAX_ROWS_TO_FETCH },
    { enabled: !!query && !!query.q && query.q.length > 0 },
  );

  // build the word list for graph
  const { wordList, fill } = useMemo(() => {
    if (!data) {
      return { wordList: undefined, fill: undefined };
    }
    return buildWCDict(data, sliderRange, state.currentSliderValue, colorRange);
  }, [data]);

  // convert filters to tags
  const filterTagItems: ITagItem[] = useMemo(() => {
    return state.filters.map((word) => ({
      id: word,
      label: word,
    }));
  }, [state.filters]);

  // when a word is clicked
  const handleSelectWord = (word: string) => {
    dispatch({ type: 'ADD_FILTER', payload: word });
  };

  // trigger search with filters
  const handleApplyFilters = () => {};

  return (
    <Box as="section" aria-label="Concept Cloud graph" my={10}>
      {isError && (
        <StandardAlertMessage
          status="error"
          title="Error fetching concept cloud data!"
          description={axios.isAxiosError(error) && error.message}
        />
      )}
      {isLoading && <LoadingMessage message="Fetching concept cloud data" />}
      {!isLoading && isSuccess && data && (
        <Box>
          <Expandable
            title="About Author Network"
            description={
              <>
                This visualization shows you unique and frequent words from a set of the top 100 search results.
                <SimpleLink href="/help/actions/visualize#word-cloud" newTab>
                  Learn more about concept cloud
                </SimpleLink>
              </>
            }
          />
          <FilterSearchBar
            tagItems={filterTagItems}
            onRemove={(tag) => dispatch({ type: 'REMOVE_FILTER', payload: tag.id as string })}
            onClear={() => dispatch({ type: 'CLEAR_FILTERS' })}
            onApply={handleApplyFilters}
            description="Narrow down your search results"
            placeHolder="Click on a term to add it to this list."
          />
          <WordCloudPane wordData={wordList} fill={fill} onSelect={handleSelectWord} />
        </Box>
      )}
    </Box>
  );
};

// wrap with memo to prevent undesirable changes
export const ConceptCloudPageContainer = memo(_ConceptCloudPageContainer, (prev, cur) => prev.query === cur.query);
