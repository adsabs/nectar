import * as d3 from 'd3';
import { pluck } from 'ramda';
import { useMemo } from 'react';
import { BubblePlotProps } from './BubblePlot';

export const useBubblePlot = ({
  width,
  height,
  nodes,
  journalNames,
  xKey,
  yKey,
  rKey,
  xScaleType,
  yScaleType,
}: BubblePlotProps & { width: number; height: number }) => {
  const xExtent = d3.sum(pluck(xKey, nodes));
  const xLogPossible = !!xExtent;
  const yExtent = d3.sum(pluck(yKey, nodes));
  const yLogPossible = !!yExtent;

  const journalScale = useMemo(
    () =>
      d3
        .scaleOrdinal<string>()
        .domain(journalNames)
        .range([
          'hsla(282, 80%, 52%, 1)',
          'hsla(1, 80%, 51%, 1)',
          'hsla(152, 80%, 40%, 1)',
          'hsla(193, 80%, 48%, 1)',
          'hsla(220, 80%, 56%, 1)',
          'hsla(0, 0%, 20%, 1)',
        ]),
    [journalNames],
  );

  // get d3 xScale function based what's used for x-axis
  const xScale = useMemo(() => {
    const extent = d3.extent(nodes, (d) => d[xKey]);
    if (xKey === 'date') {
      return d3.scaleTime().domain(extent).range([0, width]);
    } else {
      return xScaleType === 'log' && xLogPossible
        ? d3.scaleLog().domain([1, extent[1]]).range([0, width]) // log scale cannot include 0
        : d3.scaleLinear().domain(extent).range([0, width]);
    }
  }, [nodes, xKey, xScaleType, xLogPossible]);

  // get d3 yScale function based log or linear scale
  const yScale = useMemo(() => {
    const extent = d3.extent(nodes, (d) => d[yKey]);
    return yScaleType === 'log' && yLogPossible
      ? d3.scaleLog().domain([1, extent[1]]).range([height, 0]) // log scale cannot include 0
      : d3.scaleLinear().domain(extent).range([height, 0]);
  }, [nodes, yKey, yScaleType, yLogPossible]);

  // scale for bubble size
  const rScale = useMemo(() => {
    const extent = d3.extent(nodes, (n) => n[rKey]);
    return rKey === 'year'
      ? d3.scaleLinear().domain(extent).range([2, 14])
      : d3.scaleLinear().domain(extent).range([4, 26]);
  }, [nodes, rKey]);

  return { journalScale, xScale, yScale, rScale, xLogPossible, yLogPossible };
};
