import { IBucket, ISearchStats } from '@api';
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
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
import { ReactElement, useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { LineGraph } from '@components';
import { Y_Axis, ILineGraph } from '../types';
import { getHIndexGraphData, getLineGraphYearTicks } from '../utils';

export interface IHIndexGraphPaneProps {
  buckets: IBucket[];
  sum: ISearchStats['sum'];
  type: 'citations' | 'reads';
  onApplyCondition: (cond: string) => void;
}
const maxDataPoints = 2000;

export const HIndexGraphPane = ({ buckets, sum, type, onApplyCondition }: IHIndexGraphPaneProps): ReactElement => {
  const [limits, setLimits] = useState<{ limit: number; maxLimit: number }>({
    limit: maxDataPoints,
    maxLimit: maxDataPoints,
  });
  const [yaxis, setYaxis] = useState<Y_Axis>('linear');

  // prevent graph transform until user has stopped updating slider
  const [debouncedLimit] = useDebounce(limits.limit, 50);

  const baseGraph: ILineGraph = useMemo(() => {
    if (buckets) {
      const data = getHIndexGraphData(buckets, maxDataPoints);
      const hi = data.findIndex((d) => d.x > d.y);
      const hindex = hi > 0 ? (data[hi - 1].x as number) : undefined;
      return {
        data: [{ id: type, data }],
        hindex,
      };
    }
  }, [buckets]);

  const transformedGraph: ILineGraph = useMemo(() => {
    if (baseGraph) {
      const data = baseGraph.data[0].data.filter((d) => {
        if (yaxis === 'log') {
          return d.x <= limits.limit && d.y > 0;
        } else {
          return d.x <= limits.limit;
        }
      });
      return {
        ...baseGraph,
        data: [{ id: type, data }],
      };
    }
  }, [baseGraph, debouncedLimit, yaxis]);

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

  const handleApplyLimit = () => {
    const cond = `[${baseGraph.data[0].data[limits.limit - 1].y as number} TO 9999999]`;
    onApplyCondition(cond);
  };

  const handleChangeYAxis = (value: string) => {
    setYaxis(value as Y_Axis);
  };

  return (
    <>
      {transformedGraph && (
        <>
          {transformedGraph.data[0].length < 2 ? (
            <Text>Not enough data to make a useful graph</Text>
          ) : (
            <Flex direction="column" gap={2} mt={5}>
              <Text>
                <b>{isNaN(limits.limit) || limits.limit > limits.maxLimit ? limits.maxLimit : limits.limit}</b> top
                ranked {type} of <b>{statsCount}</b>
              </Text>
              <Text>H-Index for results: {transformedGraph.hindex ? transformedGraph.hindex : ''}</Text>
              <FormControl>
                <Flex direction="row">
                  <FormLabel>Y-Axis</FormLabel>
                  <RadioGroup value={yaxis} onChange={handleChangeYAxis} size="md">
                    <Stack spacing={4} direction="row">
                      <Radio value="linear">Linear</Radio>
                      <Radio value="log">Log</Radio>
                    </Stack>
                  </RadioGroup>
                </Flex>
              </FormControl>
              <LineGraph
                data={transformedGraph.data}
                ticks={getLineGraphYearTicks(transformedGraph.data, 10)}
                showLegend={false}
                type={yaxis}
              />
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
                <Text> most {type === 'citations' ? 'cited' : 'read'}</Text>
                <Button type="submit" onClick={handleApplyLimit}>
                  Search
                </Button>
              </HStack>
            </Flex>
          )}
        </>
      )}
    </>
  );
};
