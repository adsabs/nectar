import { getSearchFacetYearsParams, IADSApiSearchParams, useGetSearchFacetCounts } from '@api';
import { Box, CircularProgress } from '@chakra-ui/react';
import { HistogramSlider, ISearchFacetProps } from '@components';
import { getYearsGraph } from '@components/Visualizations/utils';
import { getFQValue, Query, removeFQ, setFQ } from '@query-utils';
import { useStore } from '@store';
import { useMemo } from 'react';

export interface IYearHistogramSliderProps {
  onQueryUpdate: ISearchFacetProps['onQueryUpdate'];
}

const fqName = 'range';

export const YearHistogramSlider = ({ onQueryUpdate }: IYearHistogramSliderProps) => {
  const query = useStore((state) => state.latestQuery);

  // query without the year range filter, to show all years on the histogram
  const cleanedQuery = useMemo(() => {
    const q = JSON.parse(JSON.stringify(query)) as IADSApiSearchParams;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    return q.fq ? (removeFQ(fqName, q as Query) as IADSApiSearchParams) : q;
  }, [query]);

  const fqRange = useMemo(() => {
    return getFQValue(fqName, query as Query);
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
    const newQuery = setFQ(fqName, `year:${values[0]}-${values[1]}`, cleanedQuery as Query);
    onQueryUpdate(newQuery);
  };

  return (
    <Box>
      {isLoading && <CircularProgress isIndeterminate />}
      {histogramData && selectedRange && (
        <Box height="170" position="relative" mt={5}>
          <HistogramSlider
            data={histogramData}
            selectedRange={selectedRange}
            width={200}
            height={125}
            onValuesChanged={handleApply}
          />
        </Box>
      )}
    </Box>
  );
};
