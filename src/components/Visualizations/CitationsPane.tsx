import { IADSApiSearchResponse, IBucket } from '@api';
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
import { LineGraph as LineGraphGraph } from './LineGraph';
import { getLineGraphYearTicks } from './utils';

const maxDataPoints = 2000;

export const CitationsPanel = ({
  queryResult,
}: {
  queryResult: UseQueryResult<IADSApiSearchResponse, unknown>;
}): ReactElement => {
  const { data, isLoading, isError, error } = queryResult;

  const [limit, setLimit] = useState(maxDataPoints);

  // prevent graph transform until user has stopped updating slider
  const [debouncedLimit] = useDebounce(limit, 50);

  const baseGraph: LineGraph = useMemo(() => {
    if (data?.facets?.citation_count?.buckets) {
      return getCitationsGraph(data.facets.citation_count.buckets, limit);
    }
  }, [data, debouncedLimit]);

  const statsCount = useMemo(() => {
    if (data?.stats.stats_fields?.citation_count?.sum) {
      return data.stats.stats_fields.citation_count.sum.toLocaleString('en-US');
    }
  }, [data]);

  useEffect(() => {
    if (data) {
      setLimit(baseGraph.data[0].data.length);
    }
  }, [data]);

  const handleLimitSliderChange = (value: number) => {
    setLimit(value);
  };

  const handleLimitInputChange = (valueAsString: string, valueAsNumber: number) => {
    setLimit(valueAsNumber);
  };

  return (
    <>
      {isLoading && <CircularProgress isIndeterminate />}
      {!isLoading && !isError && baseGraph && (
        <Flex direction="column">
          <Text>{`${
            isNaN(limit) || limit > maxDataPoints ? maxDataPoints : limit
          } top ranked citations of ${statsCount}`}</Text>
          <LineGraphGraph data={baseGraph.data} ticks={getLineGraphYearTicks(baseGraph.data, 10)} />
          <Slider
            aria-label="limit slider"
            min={1}
            max={maxDataPoints}
            value={limit}
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
              value={isNaN(limit) ? '' : limit}
              min={1}
              max={maxDataPoints}
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

const getCitationsGraph = (counts: IBucket[], limit: number): LineGraph => {
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

  return { data: [{ id: 'citations', data }] };
};
