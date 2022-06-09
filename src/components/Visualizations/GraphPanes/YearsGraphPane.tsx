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
import { ReactElement, useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { IBarGraph, YearDatum } from '../types';
import { getYearsGraph, groupBarDatumByYear } from '../utils';

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
      // user selected min and max year to display
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
      const endIndex = startIndex + (max - min) + 1;
      if (totalYears > MAX_X_COUNT) {
        // too crowded to display, create a new bar graph by merging the years
        const groupedDatum = groupBarDatumByYear(baseGraph.data, MAX_X_COUNT, startIndex, endIndex);
        return { data: groupedDatum, keys: baseGraph.keys, indexBy: baseGraph.indexBy };
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
