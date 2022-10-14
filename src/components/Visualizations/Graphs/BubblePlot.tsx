import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useD3 } from './useD3';
import * as d3 from 'd3';
import { BaseType, Selection } from 'd3';
import { useBubblePlot } from './useBubblePlot';
import { IBubblePlot, IBubblePlotNodeData } from '../types';

export type Scale = 'linear' | 'log';

export type BubblePlotConfig = {
  xKey: 'date' | 'citation_count';
  yKey: 'citation_count' | 'read_count';
  rKey: 'citation_count' | 'read_count' | 'year'; // radius
  xScaleTypes: Scale[];
  yScaleTypes: Scale[];
  xLabel: string;
  yLabel: string;
};

export type BubblePlotProps = BubblePlotConfig & {
  graph: IBubblePlot;
};

const margin = { top: 80, right: 80, bottom: 80, left: 80 };
const width = 1000 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

export const BubblePlot = ({
  graph,
  xKey,
  yKey,
  rKey,
  xScaleTypes,
  yScaleTypes,
  xLabel,
  yLabel,
}: BubblePlotProps): ReactElement => {
  const [currentScaleType, setCurrentScaleType] = useState({ x: xScaleTypes[0], y: yScaleTypes[0] });

  useEffect(() => setCurrentScaleType({ x: xScaleTypes[0], y: yScaleTypes[0] }), [xScaleTypes, yScaleTypes]);

  const { groupColor, xScale, yScale, rScale } = useBubblePlot({
    graph,
    xKey,
    yKey,
    rKey,
    xScaleType: currentScaleType.x,
    yScaleType: currentScaleType.y,
    width,
    height,
  });

  const { data: nodes, groups = [] } = graph;

  // For time axis, show year if more than 2 years, otherwise show month
  const timeRange = useMemo(() => {
    const dateRange = d3.extent(nodes, (d) => d.date);
    return dateRange[1].getFullYear() - dateRange[0].getFullYear() > 2 ? 'year' : 'month';
  }, [nodes]);

  const renderAxisScaleOptions = (
    labelGroup: Selection<SVGGElement, unknown, HTMLElement, unknown>,
    scaleTypes: Scale[],
    selectedScaleType: Scale,
  ) => {
    if (scaleTypes.includes('log')) {
      labelGroup
        .append('circle')
        .classed('scale-choice', true)
        .classed('log', true)
        .classed('selected', selectedScaleType === 'log')
        .attr('r', '6px')
        .attr('cx', 200)
        .attr('cy', -10);

      labelGroup.append('text').attr('x', 210).attr('y', -5).text('log').classed('log', true);
    }

    // only need to show this if there are more than 1 scale options
    if (scaleTypes.includes('linear') && scaleTypes.length > 1) {
      labelGroup
        .append('circle')
        .classed('scale-choice', true)
        .classed('linear', true)
        .classed('selected', selectedScaleType === 'linear')
        .attr('r', '6px')
        .attr('cx', 250)
        .attr('cy', -10);

      labelGroup.append('text').attr('x', 260).attr('y', -5).text('linear');
    }
  };

  const renderAxisLabels = (
    xLabelElement: Selection<SVGGElement, unknown, HTMLElement, unknown>,
    yLabelElement: Selection<SVGGElement, unknown, HTMLElement, unknown>,
  ) => {
    // x axis label
    xLabelElement.selectAll('*').remove();
    xLabelElement.append('text').text(xLabel).classed('axis-title', true);
    xLabelElement.call(renderAxisScaleOptions, xScaleTypes, currentScaleType.x);

    // y axis label
    yLabelElement.selectAll('*').remove();
    yLabelElement.append('text').text(yLabel).classed('axis-title', true);
    yLabelElement.call(renderAxisScaleOptions, yScaleTypes, currentScaleType.y);

    // listeners to scale changes
    // these linsteners should be removed at element.selectAll('*').remove()
    xLabelElement
      .select('.scale-choice.linear')
      .on('click', () => setCurrentScaleType({ ...currentScaleType, x: 'linear' }));
    xLabelElement.select('.scale-choice.log').on('click', () => setCurrentScaleType({ ...currentScaleType, x: 'log' }));

    yLabelElement
      .select('.scale-choice.linear')
      .on('click', () => setCurrentScaleType({ ...currentScaleType, y: 'linear' }));
    yLabelElement.select('.scale-choice.log').on('click', () => setCurrentScaleType({ ...currentScaleType, y: 'log' }));
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

      // filter out 0 values if using log scale (not valid)
      let filteredNodes = currentScaleType.y === 'log' ? nodes.filter((n) => n[yKey] !== 0) : nodes;
      filteredNodes = currentScaleType.x === 'log' ? filteredNodes.filter((n) => n[xKey] !== 0) : filteredNodes;

      // Render nodes
      g.selectAll<BaseType, IBubblePlotNodeData>('.paper-circle')
        .data(filteredNodes)
        .join('circle')
        .classed('paper-circle', true)
        .attr('r', (d) => `${rScale(d[rKey])}px`)
        .attr('cx', (d) => xScale(d[xKey]))
        .attr('cy', (d) => (currentScaleType.y === 'log' && d[yKey] === 0 ? 0 : yScale(d[yKey])))
        .attr('stroke', 'black')
        .style('opacity', 0.7)
        .style('fill', (d) => (groups && groups.includes(d.pub) ? groupColor(d.pub) : 'gray'));

      return svg;
    },
    [nodes, xScale, yScale, rScale, currentScaleType],
  );

  const { ref } = useD3(renderFunction, [renderFunction]);

  return <svg ref={ref} />;
};
