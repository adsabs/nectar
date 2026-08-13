import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VisuallyHidden,
} from '@chakra-ui/react';

import { ReactElement, useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { IBarGraph, YearDatum } from '../types';
import { getYearGraphTicks, getYearsGraph } from '../utils';
import { DataDownloader } from '@/components/DataDownloader';
import { BarGraph, CustomBarTooltip } from '../Graphs/BarGraph';
import { Slider } from '@/components/Slider';
import { IFacetCountsFields } from '@/api/search/types';

export interface IYearsGraphPaneProps {
  data: IFacetCountsFields;
  onApplyYearRange: (min: number, max: number) => void;
}

export const YearsGraphPane = ({ data, onApplyYearRange }: IYearsGraphPaneProps): ReactElement => {
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
    onApplyYearRange(range.min, range.max);
  };

  // transformed the graph data using the range
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

      const startIndex = min - firstYear;
      const endIndex = startIndex + (max - min) + 1;
      return {
        data: baseGraph.data.slice(startIndex, endIndex + 1),
        keys: baseGraph.keys,
        indexBy: baseGraph.indexBy,
        // reduce the number of ticks if too crowded
        ticks:
          endIndex - startIndex > 20
            ? getYearGraphTicks(baseGraph.data.slice(startIndex, endIndex + 1), 10)
            : undefined,
      };
    }
  }, [baseGraph, debouncedRange]);

  const tableData = useMemo(() => {
    if (transformedGraph) {
      const refereed = transformedGraph.data.reduce((acc, { refereed }) => acc + refereed, 0);
      const notRefereed = transformedGraph.data.reduce((acc, { notrefereed }) => acc + notrefereed, 0);
      const total = refereed + notRefereed;
      return {
        refereed,
        notRefereed,
        total,
      };
    }
  }, [transformedGraph]);

  const getCSVDataContent = () =>
    baseGraph.data.reduce(
      (content, { year, refereed, notrefereed }) => content + `\n${year},${refereed + notrefereed},${refereed}`,
      'Year, Article Count, Ref Count',
    );

  const dataTable = useMemo(() => {
    if (tableData) {
      return (
        <Table width="fit-content" aria-label="data table">
          <Thead>
            <Tr>
              <Th>
                <VisuallyHidden>no value</VisuallyHidden>
              </Th>
              <Th>Count</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td>Refereed</Td>
              <Td>{tableData.refereed}</Td>
            </Tr>
            <Tr>
              <Td>Non-Refereed</Td>
              <Td>{tableData.notRefereed}</Td>
            </Tr>
            <Tr>
              <Td>Total</Td>
              <Td>{tableData.total}</Td>
            </Tr>
          </Tbody>
        </Table>
      );
    }
  }, [tableData]);

  return (
    <>
      {transformedGraph && (
        <Flex direction="column">
          <DataDownloader label="Download CSV Data" getFileContent={getCSVDataContent} fileName="years.csv" my={5} />
          {dataTable}
          <BarGraph
            data={transformedGraph.data}
            indexBy={transformedGraph.indexBy}
            keys={transformedGraph.keys}
            showGroupOptions={false}
            ticks={transformedGraph.ticks}
            padding={0.1}
            tooltip={(bar) => <CustomBarTooltip keys={transformedGraph.keys} bar={bar} />}
          />
          <Slider
            range={[firstYear, lastYear]}
            values={[range.min, range.max]}
            onSlideEnd={handleRangeChange}
            my={5}
            px={4}
            size={1}
          />
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
