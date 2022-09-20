import { IADSApiSearchParams, useGetWordCloud } from '@api';
import { Box } from '@chakra-ui/react';
import { LoadingMessage, StandardAlertMessage } from '@components';
import axios from 'axios';
import { memo, ReactElement, Reducer, useMemo, useReducer } from 'react';
import { WordCloudPane } from '../GraphPanes/WordCloudPane';
import { ISliderRange } from '../types';
import { buildWCDict } from '../utils';

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
}

type ConceptCloudPageAction = { type: 'UPDATE_SLIDER_VALUE'; payload: number };

const reducer: Reducer<IConceptCloudPageState, ConceptCloudPageAction> = (state, action) => {
  switch (action.type) {
    case 'UPDATE_SLIDER_VALUE':
      return { ...state, currentSliderValue: action.payload };
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
  });

  const { data, isLoading, isSuccess, isError, error } = useGetWordCloud(
    { ...query, rows: MAX_ROWS_TO_FETCH },
    { enabled: !!query && !!query.q && query.q.length > 0 },
  );

  const { wordList, fill } = useMemo(() => {
    if (!data) {
      return { wordList: undefined, fill: undefined };
    }
    return buildWCDict(data, sliderRange, state.currentSliderValue, colorRange);
  }, [data]);

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
      {!isLoading && isSuccess && data && <WordCloudPane wordData={wordList} fill={fill} />}
    </Box>
  );
};

// wrap with memo to prevent undesirable changes
export const ConceptCloudPageContainer = memo(_ConceptCloudPageContainer, (prev, cur) => prev.query === cur.query);
