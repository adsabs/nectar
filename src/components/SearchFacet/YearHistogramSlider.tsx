import { Box, Center, CircularProgress, Flex, Heading, Icon, IconButton, Text, VisuallyHidden } from '@chakra-ui/react';

import { getYearsGraph } from '@/components/Visualizations/utils';
import { getFQValue, removeFQ, setFQ } from '@/query-utils';
import { useStore } from '@/store';
import { memo, useMemo } from 'react';
import { withErrorBoundary } from '@/hocs/withErrorBoundary';
import { ArrowsOutIcon } from '@/components/icons/ArrowsOut';
import { ArrowsInIcon } from '@/components/icons/ArrowsIn';
import { getFallBackAlert } from '@/components/Feedbacks/SuspendedAlert';
import { ISearchFacetProps } from '@/components/SearchFacet/SearchFacet';
import { HistogramSlider } from '@/components/HistogramSlider';
import { IADSApiSearchParams } from '@/api/search/types';
import { useGetSearchFacetCounts } from '@/api/search/search';
import { getSearchFacetYearsParams } from '@/api/search/models';

export const fqNameYearRange = 'range';
export interface IYearHistogramSliderProps {
  onQueryUpdate: ISearchFacetProps['onQueryUpdate'];
  expanded?: boolean;
  onExpand?: () => void;
  width: number;
  height: number;
}

const Component = ({ onQueryUpdate, width, height, onExpand, expanded }: IYearHistogramSliderProps) => {
  const query = useStore((state) => state.latestQuery);

  // query without the year range filter, to show all years on the histogram
  const cleanedQuery = useMemo(() => {
    const q = JSON.parse(JSON.stringify(query)) as IADSApiSearchParams;

    return q.fq ? (removeFQ(fqNameYearRange, q) as IADSApiSearchParams) : q;
  }, [query]);

  const fqRange = useMemo(() => {
    return getFQValue(fqNameYearRange, query);
  }, [query]);

  const { data } = useGetSearchFacetCounts(getSearchFacetYearsParams(cleanedQuery), {
    enabled: !!cleanedQuery && cleanedQuery.q.trim().length > 0,
    suspense: true,
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
    if (fqRange && histogramData) {
      const range = /year:(\d{4})-(\d{4})/gm.exec(fqRange);
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

  return (
    <Box as="section" position="relative" aria-labelledby="year-histogram">
      <VisuallyHidden>
        <Heading as="h3" id="year-histogram">
          Year Histogram
        </Heading>
      </VisuallyHidden>
      <IconButton
        aria-label="expand"
        position="absolute"
        size="xs"
        icon={<Icon as={expanded ? ArrowsInIcon : ArrowsOutIcon} fontSize="xl" />}
        top={0}
        left={0}
        colorScheme="gray"
        variant="outline"
        onClick={onExpand}
      />
      <Center>
        <Text fontWeight="semibold" fontSize="sm">
          Year(s)
        </Text>
      </Center>
      <Flex justifyContent="center">
        {histogramData && selectedRange && (
          <Box height="170" position="relative" mt={5}>
            <HistogramSlider
              data={histogramData}
              selectedRange={selectedRange}
              width={histogramData.length === 1 ? 50 : width}
              height={height}
              onValuesChanged={handleApply}
            />
          </Box>
        )}
      </Flex>
    </Box>
  );
};

export const HistogramSliderLoader = () => {
  return (
    <Flex direction="column" justifyContent="center" alignItems="center" height="170" position="relative" mt={5}>
      <CircularProgress isIndeterminate />
    </Flex>
  );
};

export const YearHistogramSlider = withErrorBoundary(
  {
    onLoadingRender: () => <HistogramSliderLoader />,
    onErrorRender: getFallBackAlert({ label: 'Unable to load histogram', variant: 'minimal' }),
  },
  memo(Component),
);
