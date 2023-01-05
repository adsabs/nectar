import { getSearchFacetYearsParams, IADSApiSearchParams, useGetSearchFacetCounts } from '@api';
import { Box, CircularProgress, IconButton } from '@chakra-ui/react';
import { HistogramSlider, ISearchFacetProps } from '@components';
import { ArrowsInIcon } from '@components/icons/ArrowsIn';
import { ArrowsOutIcon } from '@components/icons/ArrowsOut';
import { getYearsGraph } from '@components/Visualizations/utils';
import { fqNameYearRange } from '@query';
import { getFQValue, removeFQ, setFQ } from '@query-utils';
import { useStore } from '@store';
import { useMemo } from 'react';

export interface IYearHistogramSliderProps {
  onQueryUpdate: ISearchFacetProps['onQueryUpdate'];
  isExpanded: boolean;
  onToggleExpand: () => void;
  width: number;
  height: number;
}

export const YearHistogramSlider = ({
  onQueryUpdate,
  isExpanded,
  onToggleExpand,
  width,
  height,
}: IYearHistogramSliderProps) => {
  const query = useStore((state) => state.latestQuery);

  // query without the year range filter, to show all years on the histogram
  const cleanedQuery = useMemo(() => {
    const q = JSON.parse(JSON.stringify(query)) as IADSApiSearchParams;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    return q.fq ? (removeFQ(fqNameYearRange, q) as IADSApiSearchParams) : q;
  }, [query]);

  const fqRange = useMemo(() => {
    return getFQValue(fqNameYearRange, query);
  }, [query]);

  const { data, isLoading } = useGetSearchFacetCounts(getSearchFacetYearsParams(cleanedQuery), {
    enabled: !!cleanedQuery && cleanedQuery.q.trim().length > 0,
  });

  const histogramData = useMemo(() => {
    if (data) {
      return getYearsGraph(data).data.map((d) => ({
        x: d.year,
        y: d.notrefereed + d.refereed,
      }));
    }
  }, [data]);

  // Selected range
  // - If the query has range fq, set range to that
  // - if no range fq, use histogram min and max
  const selectedRange: [number, number] = useMemo(() => {
    if (fqRange) {
      const range = /year:([0-9]{4})-([0-9]{4})/gm.exec(fqRange);
      if (range.length === 3) {
        return [parseInt(range[1]), parseInt(range[2])];
      }
    } else if (histogramData) {
      return [histogramData[0].x, histogramData[histogramData.length - 1].x];
    }
    return null;
  }, [fqRange, histogramData]);

  const handleApply = (values: number[]) => {
    // add year range fq
    const newQuery = setFQ(fqNameYearRange, `year:${values[0]}-${values[1]}`, cleanedQuery);
    onQueryUpdate(newQuery);
  };

  const handleToggleExpand = () => {
    onToggleExpand();
  };

  return (
    <Box>
      {isLoading && <CircularProgress isIndeterminate />}
      {histogramData && selectedRange && (
        <Box height="170" position="relative" mt={5}>
          <IconButton
            aria-label="expand"
            icon={isExpanded ? <ArrowsInIcon /> : <ArrowsOutIcon />}
            position="absolute"
            top={0}
            left={0}
            colorScheme="gray"
            variant="outline"
            onClick={handleToggleExpand}
          />
          <HistogramSlider
            data={histogramData}
            selectedRange={selectedRange}
            width={width}
            height={height}
            onValuesChanged={handleApply}
          />
        </Box>
      )}
    </Box>
  );
};
