import { getSearchFacetYearsParams, IADSApiSearchParams, useGetSearchFacetCounts } from '@api';
import { Box, Button, CircularProgress } from '@chakra-ui/react';
import { HistogramSlider, ISearchFacetProps } from '@components';
import { getYearsGraph } from '@components/Visualizations/utils';
import { getFQValue, Query, removeFQ, setFQ } from '@query-utils';
import { useStore } from '@store';
import { makeSearchParams } from '@utils';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

export interface IYearHistogramSliderProps {
  onQueryUpdate: ISearchFacetProps['onQueryUpdate'];
}

const fqName = 'range';

// TODO: when too many 'years' graph doesn't show
export const YearHistogramSlider = ({ onQueryUpdate }: IYearHistogramSliderProps) => {
  const query = useStore((state) => state.latestQuery);

  const router = useRouter();

  // query without the year range filter, to show all years on the histogram
  const cleanedQuery = useMemo(() => {
    const q = JSON.parse(JSON.stringify(query)) as IADSApiSearchParams;
    return q.fq ? (removeFQ(fqName, q as Query) as IADSApiSearchParams) : q;
  }, [query]);

  const fqRange = useMemo(() => {
    return getFQValue(fqName, query as Query);
  }, [query]);

  const { data, isLoading, isError } = useGetSearchFacetCounts(getSearchFacetYearsParams(cleanedQuery), {
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

  // Initialize range
  // - If the query has range fq, set range to that
  // - if no range fq, us histogram min and max
  // - if no histogram data, set to 0,0
  const [selectedRange, setSelectedRange] = useState<number[]>(
    fqRange
      ? /year:([0-9]{4})-([0-9]{4})/gm
          .exec(fqRange)
          .splice(1)
          .map((y) => parseInt(y))
      : histogramData
      ? [histogramData[0].x, histogramData[histogramData.length - 1].x]
      : [0, 0],
  );

  useEffect(() => {
    setSelectedRange(
      fqRange
        ? /year:([0-9]{4})-([0-9]{4})/gm
            .exec(fqRange)
            .splice(1)
            .map((y) => parseInt(y))
        : histogramData
        ? [histogramData[0].x, histogramData[histogramData.length - 1].x]
        : [0, 0],
    );
  }, [fqRange, histogramData]);

  // 1. this needs to be moved up to parent component?
  // 2. fetching data moved to parent?
  const handleApply = () => {
    // add year range fq
    const newQuery = setFQ(fqName, `year:${selectedRange[0]}-${selectedRange[1]}`, cleanedQuery as Query);
    const search = makeSearchParams(newQuery as IADSApiSearchParams);
    void router.push({ pathname: router.pathname, search }, null, { scroll: false, shallow: true });
  };

  return (
    <Box m={5}>
      {isLoading && <CircularProgress isIndeterminate />}
      {histogramData && (
        <Box h="36" position="relative">
          <HistogramSlider
            data={histogramData}
            selectedRange={selectedRange}
            barGraphH="100px"
            onValuesChanged={setSelectedRange}
          />
          <Button position="absolute" top="0" left="0" size="xs" variant="outline" onClick={handleApply}>
            Apply
          </Button>
        </Box>
      )}
    </Box>
  );
};
