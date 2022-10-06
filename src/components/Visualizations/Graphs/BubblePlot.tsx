import { ReactElement, useCallback, useMemo } from 'react';
import { useD3 } from './useD3';
import * as d3 from 'd3';
import { BaseType, Selection } from 'd3';
import { useBubblePlot } from './useBubblePlot';

export type Scale = 'linear' | 'log';

export type BubblePlotConfig = {
  xKey: 'date' | 'citation_count';
  yKey: 'citation_count' | 'read_count';
  rKey: 'citation_count' | 'read_count' | 'year'; // radius
  xScaleType: Scale;
  yScaleType: Scale;
  xLabel: string;
  yLabel: string;
};

export type BubblePlotProps = BubblePlotConfig & {
  nodes: IBubblePlotNodeData[];
  journalNames: string[];
};

export interface IBubblePlotNodeData {
  bibcode: string;
  pubdate: string;
  title: string;
  read_count: number;
  citation_count: number;
  date: Date;
  year: number;
  pub: string;
}

const margin = { top: 80, right: 80, bottom: 80, left: 80 };
const width = 1000 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

export const BubblePlot = ({
  nodes,
  journalNames,
  xKey,
  yKey,
  rKey,
  xScaleType,
  yScaleType,
  xLabel,
  yLabel,
}: BubblePlotProps): ReactElement => {
  const { journalScale, xScale, yScale, rScale, xLogPossible, yLogPossible } = useBubblePlot({
    nodes,
    journalNames,
    xKey,
    yKey,
    rKey,
    xScaleType,
    yScaleType,
    width,
    height,
  });

  // For time axis, show year if more than 2 years, otherwise show month
  const timeRange = useMemo(() => {
    const dateRange = d3.extent(nodes, (d) => d.date);
    return dateRange[1].getFullYear() - dateRange[0].getFullYear() > 2 ? 'year' : 'month';
  }, [nodes]);

  const renderAxisScaleOptions = (
    labelGroup: Selection<SVGGElement, unknown, HTMLElement, unknown>,
    scaleType: Scale,
  ) => {
    labelGroup
      .append('circle')
      .classed('scale-choice', true)
      .classed('log', true)
      .classed('selected', scaleType === 'log')
      .attr('r', '6px')
      .attr('cx', 200)
      .attr('cy', -10);

    labelGroup.append('text').attr('x', 210).attr('y', -5).text('log').classed('log', true);

    labelGroup
      .append('circle')
      .classed('scale-choice', true)
      .classed('linear', true)
      .classed('selected', scaleType === 'linear')
      .attr('r', '6px')
      .attr('cx', 250)
      .attr('cy', -10);

    labelGroup.append('text').attr('x', 260).attr('y', -5).text('linear');
  };

  const renderAxisLabels = (
    xLabelElement: Selection<SVGGElement, unknown, HTMLElement, unknown>,
    yLabelElement: Selection<SVGGElement, unknown, HTMLElement, unknown>,
  ) => {
    // x axis label
    xLabelElement.selectAll('*').remove();
    xLabelElement.append('text').text(xLabel).classed('axis-title', true);

    if (xKey !== 'date') {
      xLabelElement.call(renderAxisScaleOptions, xScaleType);
    }

    // y axis label
    yLabelElement.selectAll('*').remove();

    yLabelElement.append('text').text(yLabel).classed('axis-title', true);

    yLabelElement.call(renderAxisScaleOptions, yScaleType);
  };

  const renderFunction = useCallback(
    (svg: Selection<SVGSVGElement, unknown, HTMLElement, unknown>) => {
      svg.selectAll('*').remove();

      // attaching axes
      const xAxis =
        xKey !== 'date'
          ? d3.axisBottom(xScale)
          : timeRange === 'year'
          ? d3
              .axisBottom(xScale)
              .ticks(10)
              .tickFormat((domain) => d3.timeFormat('%Y')(domain as Date))
          : d3
              .axisBottom(xScale)
              .ticks(10)
              .tickFormat((domain) => d3.timeFormat('%b-%Y')(domain as Date));

      const yAxis = d3.axisLeft(yScale);

      svg.classed('bubble-plot-svg', true);

      const g = svg
        .attr('viewBox', [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom])
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Render Axis
      g.append('g').attr('class', 'x-axis').attr('transform', `translate(0, ${height})`).call(xAxis);

      g.append('g').attr('class', 'y-axis').call(yAxis);

      // Render axis labels
      const yLabelElement = svg
        .append('g')
        .attr('transform', `translate(${margin.left / 2}, ${height + margin.top / 2}) rotate(-90)`)
        .classed('y-label', true);

      const xLabelElement = svg
        .append('g')
        .attr('transform', `translate(${width / 2},${height + margin.top + margin.bottom / 2})`)
        .classed('x-label', true);

      renderAxisLabels(xLabelElement, yLabelElement);

      // Render nodes
      g.selectAll<BaseType, IBubblePlotNodeData>('.paper-circle')
        .data(nodes)
        .join('circle')
        .classed('paper-circle', true)
        .attr('r', (d) => `${rScale(d[rKey])}px`)
        .attr('cx', (d) => xScale(d[xKey]))
        .attr('cy', (d) => yScale(d[yKey]))
        .attr('stroke', 'black')
        .style('opacity', 0.7)
        .style('fill', (d) => (journalNames && journalNames.includes(d.pub) ? journalScale(d.pub) : 'gray'));

      return svg;
    },
    [nodes, xScale, yScale, rScale],
  );

  const { ref } = useD3(renderFunction, [renderFunction]);

  return <svg ref={ref} />;
};
