import { IBucket, ISearchStats } from '@api';
import {
  Button,
  CircularProgress,
  Flex,
  HStack,
  NumberInput,
  NumberInputField,
  Radio,
  RadioGroup,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Stack,
  Text,
} from '@chakra-ui/react';
import { LineGraph } from '@components/Metrics/types';
import { Datum } from '@nivo/line';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import { UseQueryResult } from 'react-query';
import { useDebounce } from 'use-debounce';
import { LineGraph as LineGraphGraph } from '@components/Visualizations/Graphs';
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

  const [yaxis, setYaxis] = useState('linear');

  // prevent graph transform until user has stopped updating slider
  const [debouncedLimit] = useDebounce(limits.limit, 50);

  const baseGraph: LineGraph = useMemo(() => {
    if (buckets) {
      const data = getGraphData(buckets, limits.limit);
      const hi = data.findIndex((d) => d.x > d.y);
      const hindex = hi > 0 ? (data[hi - 1].x as number) : undefined;
      return {
        data: [{ id: type, data }],
        hindex,
      };
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
        <>
          {baseGraph.data[0].length < 2 ? (
            <Text>Not enough data to make a useful graph</Text>
          ) : (
            <Flex direction="column">
              <Text>{`${
                isNaN(limits.limit) || limits.limit > limits.maxLimit ? limits.maxLimit : limits.limit
              } top ranked ${type} of ${statsCount}`}</Text>
              <Text>H-Index for results: {baseGraph.hindex ? baseGraph.hindex : ''}</Text>
              <RadioGroup value={yaxis} onChange={setYaxis}>
                <Stack spacing={4} direction="row">
                  <Radio value="linear">Linear</Radio>
                  <Radio value="log">Log</Radio>
                </Stack>
              </RadioGroup>
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
