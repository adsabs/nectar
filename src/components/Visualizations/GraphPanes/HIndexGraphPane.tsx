import { Button, Flex, HStack, NumberInput, NumberInputField, Radio, RadioGroup, Stack, Text } from '@chakra-ui/react';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';

import { ILineGraph, Y_Axis } from '../types';
import { getHIndexGraphData, getLineGraphXTicks } from '../utils';
import { LineGraph } from '@/components/Visualizations';
import { DataDownloader } from '@/components/DataDownloader';
import { Slider } from '@/components/Slider';
import { IBucket, ISearchStats } from '@/api/search/types';

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

  const handleLimitSliderChange = (value: number[]) => {
    setLimits({ ...limits, limit: value[0] });
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

  const getCSVDataContent = () => {
    let content = `Total, ${sum}\n`;

    content += `Article No., ${type}`;
    buckets.forEach((obj, i) => {
      content += `\n${i},${obj.val}`;
    });

    return content;
  };

  return (
    <>
      {transformedGraph && (
        <>
          {transformedGraph.data[0].length < 2 ? (
            <Text>Not enough data to make a useful graph</Text>
          ) : (
            <Flex direction="column">
              <DataDownloader
                label="Download CSV Data"
                getFileContent={getCSVDataContent}
                fileName={`${type}.csv`}
                my={5}
              />
              <Text>
                <b>{isNaN(limits.limit) || limits.limit > limits.maxLimit ? limits.maxLimit : limits.limit}</b> top
                ranked {type} of <b>{statsCount}</b>
              </Text>
              <Text>H-Index for results: {transformedGraph.hindex ? transformedGraph.hindex : ''}</Text>
              <fieldset>
                <Flex direction="row" gap={2}>
                  <Text as="legend" fontWeight="bold">
                    Y-Axis
                  </Text>
                  <RadioGroup value={yaxis} onChange={handleChangeYAxis} size="md">
                    <Stack spacing={4} direction="row">
                      <Radio value="linear">Linear</Radio>
                      <Radio value="log">Log</Radio>
                    </Stack>
                  </RadioGroup>
                </Flex>
              </fieldset>
              <LineGraph
                data={transformedGraph.data}
                ticks={getLineGraphXTicks(transformedGraph.data, 10)}
                showLegend={false}
                yScaleType={yaxis}
                xScaleType="linear"
              />
              <Slider
                aria-label="Limit Slider"
                range={[1, limits.maxLimit]}
                values={[isNaN(limits.limit) ? limits.maxLimit : limits.limit]}
                onSlideEnd={handleLimitSliderChange}
                my={5}
                px={4}
                size={1}
              />
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
