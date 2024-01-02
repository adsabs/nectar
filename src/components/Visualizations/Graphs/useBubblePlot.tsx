import { useColorMode } from '@chakra-ui/react';
import * as d3 from 'd3';
import { useMemo } from 'react';
import { BubblePlotProps, Scale } from './BubblePlot';

export const useBubblePlot = ({
  width,
  height,
  graph,
  xKey,
  yKey,
  rKey,
  xScaleType,
  yScaleType,
}: Omit<BubblePlotProps, 'xLabel' | 'yLabel' | 'xScaleTypes' | 'yScaleTypes' | 'onSelectNodes'> & {
  xScaleType: Scale;
  yScaleType: Scale;
  width: number;
  height: number;
}) => {
  const { data: nodes, groups = [] } = graph;

  const groupColor = useMemo(
    () =>
      d3
        .scaleOrdinal<string>()
        .domain(groups)
        .range([
          'hsla(282, 80%, 52%, 0.9)',
          'hsla(1, 80%, 51%, 0.9)',
          'hsla(152, 80%, 40%, 0.9)',
          'hsla(193, 80%, 48%, 0.9)',
          'hsla(220, 80%, 56%, 0.9)',
          'hsla(100, 50%, 20%, 0.9)',
        ]),
    [groups],
  );

  // get d3 xScale function based what's used for x-axis
  const xScaleFn = useMemo(() => {
    const extent = d3.extent(nodes, (d) => d[xKey]);
    if (xKey === 'date') {
      return d3.scaleTime().domain(extent).range([0, width]);
    } else {
      return xScaleType === 'log'
        ? d3
            .scaleLog()
            .domain([extent[0] === 0 ? 1 : extent[0], extent[1]])
            .range([0, width]) // log scale cannot include 0
        : d3.scaleLinear().domain(extent).range([0, width]);
    }
  }, [nodes, xKey, xScaleType]);

  // get d3 yScale function based log or linear scale
  const yScaleFn = useMemo(() => {
    const extent = d3.extent(nodes, (d) => d[yKey]);
    return yScaleType === 'log'
      ? d3
          .scaleLog()
          .domain([extent[0] === 0 ? 1 : extent[0], extent[1]])
          .range([height, 0]) // log scale cannot include 0
      : d3.scaleLinear().domain(extent).range([height, 0]);
  }, [nodes, yKey, yScaleType]);

  // scale for bubble size
  const rScaleFn = useMemo(() => {
    const extent = d3.extent(nodes, (n) => n[rKey]);
    return rKey === 'year'
      ? d3.scaleLinear().domain(extent).range([2, 14])
      : d3.scaleLinear().domain(extent).range([4, 26]);
  }, [nodes, rKey]);

  const { colorMode } = useColorMode();

  return { groupColor, xScaleFn, yScaleFn, rScaleFn, textColor: colorMode === 'light' ? '#000000' : '#ffffff' };
};
