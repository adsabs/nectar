import { IFacetCountsFields } from '@api';
import {
  RangeSlider,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  RangeSliderTrack,
  NumberInput,
  Flex,
  NumberInputField,
  FormControl,
  FormLabel,
  Button,
} from '@chakra-ui/react';
import { BarGraph } from '@components';
import { BarDatum } from '@nivo/bar';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { IBarGraph, YearDatum } from '../types';
import { getYearsGraph } from '../utils';

export interface IYearsGraphPaneProps {
  data: IFacetCountsFields;
  onApplyCondition: (cond: string) => void;
}

export const YearsGraphPane = ({ data, onApplyCondition }: IYearsGraphPaneProps): ReactElement => {
  const [range, setRange] = useState<{ min: number; max: number }>(null);

  const baseGraph: IBarGraph<YearDatum> = useMemo(() => {
    if (data) {
      return getYearsGraph(data);
    }
  }, [data]);

  // prevent graph transform until user has stopped updating slider
  const [debouncedRange] = useDebounce(range, 50);

  const firstYear = baseGraph.data[0].year;
  const lastYear = baseGraph.data[baseGraph.data.length - 1].year;

  useEffect(() => {
    setRange({
      min: firstYear,
      max: lastYear,
    });
  }, [baseGraph]);

  const handleRangeChange = ([min, max]: number[]) => {
    setRange({ min, max });
  };

  const handleRangeMinChange = (valueAsString: string, valueAsNumber: number) => {
    setRange({ ...range, min: valueAsNumber });
  };

  const handleRangeMaxChange = (valueAsString: string, valueAsNumber: number) => {
    setRange({ ...range, max: valueAsNumber });
  };

  const handleApplyLimit = () => {
    const cond = `${range.min}-${range.max}`;
    onApplyCondition(cond);
  };

  // transformed the graph data using the range
  // group the years if too many to display
  const MAX_X_COUNT = 10;
  const transformedGraph = useMemo(() => {
    if (range && baseGraph) {
      const min =
        isNaN(debouncedRange.min) || debouncedRange.min < firstYear || debouncedRange.min > debouncedRange.max
          ? firstYear
          : debouncedRange.min;
      const max =
        isNaN(debouncedRange.max) || debouncedRange.max > lastYear || debouncedRange.max < debouncedRange.min
          ? lastYear
          : debouncedRange.max;
      const totalYears = max - min + 1;
      const startIndex = min - firstYear;
      const endIndex = startIndex + (max - min);
      if (totalYears > MAX_X_COUNT) {
        // too crowded to display, group
        const groupSize = Math.ceil(totalYears / MAX_X_COUNT);
        const res: BarDatum[] = [];
        let index = startIndex;
        while (index <= endIndex) {
          const y = baseGraph.data[index].year;
          const gs = y + groupSize - 1 <= max ? groupSize : max - y + 1;
          const tmp = {
            year: `${y} - ${y + gs - 1}`,
            refereed: 0,
            notrefereed: 0,
          };
          for (let i = 0; i < gs; i++) {
            tmp.refereed = tmp.refereed + baseGraph.data[index + i].refereed;
            tmp.notrefereed = tmp.notrefereed + baseGraph.data[index + i].notrefereed;
          }
          res.push(tmp);
          index += gs;
        }
        return { data: res, keys: baseGraph.keys, indexBy: baseGraph.indexBy };
      } else {
        return {
          data: baseGraph.data.slice(startIndex, endIndex + 1),
          keys: baseGraph.keys,
          indexBy: baseGraph.indexBy,
        };
      }
    }
  }, [baseGraph, debouncedRange]);

  return (
    <>
      {transformedGraph && (
        <Flex direction="column">
          <BarGraph
            data={transformedGraph.data}
            indexBy={transformedGraph.indexBy}
            keys={transformedGraph.keys}
            showGroupOptions={false}
          />
          <RangeSlider
            aria-label={['min', 'max']}
            min={firstYear}
            max={lastYear}
            value={[range.min, range.max]}
            onChange={handleRangeChange}
            my={5}
            focusThumbOnChange={false}
            size="lg"
          >
            <RangeSliderTrack>
              <RangeSliderFilledTrack />
            </RangeSliderTrack>
            <RangeSliderThumb index={0} />
            <RangeSliderThumb index={1} />
          </RangeSlider>
          <FormControl my={2}>
            <FormLabel>Limit results to papers from</FormLabel>
            <Flex direction="row" alignItems="center">
              <NumberInput
                value={isNaN(range.min) ? '' : range.min}
                min={firstYear}
                max={lastYear}
                aria-label="min year"
                maxW={24}
                mx={2}
                size="sm"
                onChange={handleRangeMinChange}
              >
                <NumberInputField />
              </NumberInput>
              {' to '}
              <NumberInput
                value={isNaN(range.max) ? '' : range.max}
                min={firstYear}
                max={lastYear}
                aria-label="max year"
                maxW={24}
                mx={2}
                size="sm"
                onChange={handleRangeMaxChange}
              >
                <NumberInputField />
              </NumberInput>
              <Button type="submit" onClick={handleApplyLimit}>
                Search
              </Button>
            </Flex>
          </FormControl>
        </Flex>
      )}
    </>
  );
};
