import { IADSApiSearchParams, useGetWordCloud } from '@/api';
import { Box, Flex, Text, useBreakpointValue } from '@chakra-ui/react';
import {
  Expandable,
  ITagItem,
  IWordCloudPaneProps,
  LoadingMessage,
  SimpleLink,
  StandardAlertMessage,
  WordCloudPane,
} from '@/components';
import { makeSearchParams } from '@/utils';
import axios from 'axios';
import { useRouter } from 'next/router';
import { ReactElement, Reducer, useMemo, useReducer } from 'react';
import { ISliderRange } from '../types';
import { buildWCDict } from '../utils';
import { FilterSearchBar, IFilterSearchBarProps } from '../Widgets';

const MAX_ROWS_TO_FETCH = 100;

const colorRange = ['#80E6FF', '#7575FF', '#7575FF', '#47008F'];

const sliderRange: ISliderRange = {
  1: [1, 0, 'unique'],
  2: [0.75, 0.25, ''],
  3: [0.5, 0.5, ''],
  4: [0.25, 0.75, ''],
  5: [0, 1, 'frequent'],
};

// [...[label, value]]
const sliderValues: IWordCloudPaneProps['sliderValues'] = Object.keys(sliderRange).map((k) => [
  sliderRange[parseInt(k)][2],
  parseInt(k),
]);

interface IConceptCloudPageState {
  currentSliderValue: number;
  filters: string[];
}

type ConceptCloudPageAction =
  | { type: 'UPDATE_SLIDER_VALUE'; payload: number }
  | { type: 'ADD_OR_RM_FILTER'; payload: string }
  | { type: 'REMOVE_FILTER'; payload: string }
  | { type: 'REMOVE_FILTER_TAG'; payload: ITagItem }
  | { type: 'CLEAR_FILTERS' };

const reducer: Reducer<IConceptCloudPageState, ConceptCloudPageAction> = (state, action) => {
  switch (action.type) {
    case 'UPDATE_SLIDER_VALUE':
      return { ...state, currentSliderValue: action.payload };
    case 'ADD_OR_RM_FILTER':
      const word = action.payload;
      return state.filters.findIndex((w) => w === word) === -1
        ? { ...state, filters: [...state.filters, word] }
        : { ...state, filters: state.filters.filter((w) => w !== action.payload) };
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

export const ConceptCloudPageContainer = ({ query }: IConceptCloudPageContainerProps): ReactElement => {
  const router = useRouter();

  // filter search bar layout, use column when width is small
  const filterSearchDirection: IFilterSearchBarProps['direction'] = useBreakpointValue({ base: 'column', md: 'row' });

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
  }, [data, state.currentSliderValue]);

  // convert filters to tags
  const filterTagItems: ITagItem[] = useMemo(() => {
    return state.filters.map((word) => ({
      id: word,
      label: word,
    }));
  }, [state.filters]);

  // when a word is clicked
  const handleSelectWord = (word: string) => dispatch({ type: 'ADD_OR_RM_FILTER', payload: word });

  // trigger search with filters
  const handleApplyFilters = () => {
    const fq = '{!type=aqp v=$fq_wordcloud}';
    const fqs = query.fq || [];
    if (fqs.findIndex((f) => f === fq) === -1) {
      fqs.push(fq);
    }

    const values = state.filters.join(' OR ');

    const search = makeSearchParams({ ...query, fq: fqs, fq_wordcloud: `(${values})`, p: 1 });
    void router.push({ pathname: '/search', search }, null, { scroll: false });
  };

  // slider value changed
  const handleSliderValueChange = (value: number) => {
    dispatch({ type: 'UPDATE_SLIDER_VALUE', payload: value });
  };

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
            title="About Concept Cloud"
            description={
              <Flex direction="column" gap={2}>
                <Text>
                  This word cloud allows you to view unique and frequent words from the top 100 search results
                </Text>
                <Text>
                  Move the slider towards <strong> Frequent</strong> to view a word cloud that is simply composed of the
                  words that appeared most frequently in your results. (This word cloud is likely to feature generic
                  terms like 'observations' prominently.)
                </Text>
                <Text>
                  Move the slider towards <strong>Unique</strong> to see a word cloud that shows words that appeared in
                  your results but which appear very rarely in the rest of the ADS corpus.
                </Text>
                <Text>To facet your ADS search, select words from the word cloud and click the 'Search' button.</Text>
                <SimpleLink href="/help/actions/visualize#word-cloud" newTab>
                  Learn more about concept cloud
                </SimpleLink>
              </Flex>
            }
          />
          <FilterSearchBar
            tagItems={filterTagItems}
            onRemove={(tag) => dispatch({ type: 'REMOVE_FILTER', payload: tag.id as string })}
            onClear={() => dispatch({ type: 'CLEAR_FILTERS' })}
            onApply={handleApplyFilters}
            description="Narrow down your search results"
            placeHolder="Click on a term to add it to this list."
            direction={filterSearchDirection}
          />
          <WordCloudPane
            wordData={wordList}
            fill={fill}
            onSelect={handleSelectWord}
            onSliderValueChange={handleSliderValueChange}
            sliderValues={sliderValues}
            currentSliderValue={state.currentSliderValue}
            selectedWords={state.filters}
          />
        </Box>
      )}
    </Box>
  );
};
