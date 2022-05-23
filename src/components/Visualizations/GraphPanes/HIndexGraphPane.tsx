import { IBucket, ISearchStats } from '@api';
import {
  Button,
  CircularProgress,
  Flex,
  HStack,
  NumberInput,
  NumberInputField,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
} from '@chakra-ui/react';
import { LineGraph } from '@components/Metrics/types';
import { Datum } from '@nivo/line';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import { UseQueryResult } from 'react-query';
import { useDebounce } from 'use-debounce';
import { LineGraph as LineGraphGraph } from '@components';
import { getLineGraphYearTicks } from '../utils';

interface IHIndexGraphPaneProps {
  buckets: IBucket[];
  sum: ISearchStats['sum'];
  type: 'citations' | 'reads';
  isLoading: UseQueryResult['isLoading'];
  isError: UseQueryResult['isError'];
  error: UseQueryResult['error'];
}
const maxDataPoints = 2000;

export const HIndexGraphPane = ({
  buckets,
  sum,
  type,
  isLoading,
  isError,
  error,
}: IHIndexGraphPaneProps): ReactElement => {
  const [limits, setLimits] = useState<{ limit: number; maxLimit: number }>({
    limit: maxDataPoints,
    maxLimit: maxDataPoints,
  });

  // prevent graph transform until user has stopped updating slider
  const [debouncedLimit] = useDebounce(limits.limit, 50);

  const baseGraph: LineGraph = useMemo(() => {
    if (buckets) {
      const data = getGraphData(buckets, limits.limit);
      return { data: [{ id: type, data }] };
    }
  }, [buckets, debouncedLimit]);

  const statsCount = useMemo(() => {
    if (sum) {
      return sum.toLocaleString('en-US');
    }
  }, [sum]);

  useEffect(() => {
    if (buckets) {
      const max = Math.min(maxDataPoints, baseGraph.data[0]?.data.length);
      setLimits({ limit: max, maxLimit: max });
    }
  }, [buckets]);

  const handleLimitSliderChange = (value: number) => {
    setLimits({ ...limits, limit: value });
  };

  const handleLimitInputChange = (valueAsString: string, valueAsNumber: number) => {
    setLimits({ ...limits, limit: valueAsNumber });
  };

  return (
    <>
      {isLoading && <CircularProgress isIndeterminate />}
      {!isLoading && !isError && baseGraph && (
        <Flex direction="column">
          <Text>{`${
            isNaN(limits.limit) || limits.limit > limits.maxLimit ? limits.maxLimit : limits.limit
          } top ranked ${type} of ${statsCount}`}</Text>
          <LineGraphGraph data={baseGraph.data} ticks={getLineGraphYearTicks(baseGraph.data, 10)} />
          <Slider
            aria-label="limit slider"
            min={1}
            max={limits.maxLimit}
            value={isNaN(limits.limit) ? limits.maxLimit : limits.limit}
            onChange={handleLimitSliderChange}
            my={5}
            focusThumbOnChange={false}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          <HStack alignItems="center">
            <Text>Limit results to top </Text>
            <NumberInput
              value={isNaN(limits.limit) ? '' : limits.limit}
              min={1}
              max={limits.maxLimit}
              aria-label="limit"
              maxW={24}
              mx={2}
              size="sm"
              onChange={handleLimitInputChange}
            >
              <NumberInputField />
            </NumberInput>
            <Text> most cited</Text>
            <Button type="submit">Search</Button>
          </HStack>
        </Flex>
      )}
    </>
  );
};

const getGraphData = (counts: IBucket[], limit: number): Datum[] => {
  // data: [{x, y}...]
  const fixedLimit = isNaN(limit) || limit < 1 || limit > maxDataPoints ? maxDataPoints : limit;
  const data: Datum[] = [];
  let xCounter = 0;
  counts.some((item) => {
    xCounter += item.count;
    // one dot per paper (this way we'll only plot the top ranked X - fraction of results)
    while (xCounter > data.length && data.length < fixedLimit) {
      data.push({ y: item.val, x: data.length + 1 });
    }
    if (data.length > fixedLimit) {
      return true;
    }
    return false;
  });

  return data;
};
