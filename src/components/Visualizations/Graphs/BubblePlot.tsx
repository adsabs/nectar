import { MouseEvent, ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
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

const margin = { top: 80, right: 200, bottom: 80, left: 80 };
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

  const { data, groups = [] } = graph;

  const [selectedGroup, setSelectedGroup] = useState<string>(null);

  // For time axis, show year if more than 2 years, otherwise show month
  const timeRange = useMemo(() => {
    const dateRange = d3.extent(data, (d) => d.date);
    return dateRange[1].getFullYear() - dateRange[0].getFullYear() > 2 ? 'year' : 'month';
  }, [data]);

  const nodes = useMemo(
    () => (selectedGroup === null ? data : data.filter((n) => n.pub === selectedGroup)),
    [data, selectedGroup],
  );

  // When changing graph or axis scale
  useEffect(() => {
    transitionXAxis();
    renderXAxisLabel(d3.select('.x-label'));
    transitionYAxis();
    renderYAxisLabel(d3.select('.y-label'));
  }, [xScale, yScale]);

  useEffect(() => {
    transitionNodes();
  }, [nodes, xScale, yScale, rScale]);

  /********** transitions **********/

  const transitionXAxis = useCallback(() => {
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

    d3.select<SVGGElement, unknown>('.x-axis').transition().duration(200).call(xAxis);
  }, [xKey, xScale, timeRange]);

  const transitionYAxis = useCallback(() => {
    const yAxis = d3.axisLeft(yScale);
    d3.select<SVGGElement, unknown>('.y-axis').transition().duration(200).call(yAxis);
  }, [yScale]);

  const transitionNodes = useCallback(() => {
    d3.selectAll<BaseType, IBubblePlotNodeData>('.paper-circle')
      .data(nodes, (n) => n.bibcode)
      .transition()
      .duration(200)
      .attr('r', (d) => `${rScale(d[rKey])}px`)
      .attr('cx', (d) => (currentScaleType.x === 'log' && d[xKey] === 0 ? 0 : xScale(d[xKey])))
      .attr('cy', (d) => (currentScaleType.y === 'log' && d[yKey] === 0 ? 0 : yScale(d[yKey])))
      .style('display', (d) =>
        (currentScaleType.x === 'log' && d[xKey] === 0) || (currentScaleType.y === 'log' && d[yKey] === 0) // hide invalid nodes (log(0))
          ? 'none'
          : 'block',
      );
  }, [nodes, rScale, xScale, yScale]);

  /********** renderings **********/

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

  const renderGroupLegend = (g: Selection<SVGGElement, unknown, HTMLElement, unknown>) => {
    g.selectAll('rect')
      .data(groups)
      .enter()
      .append('rect')
      .classed('group-legend', true)
      .attr('width', 13)
      .attr('height', 13)
      .attr('y', function (d, i) {
        return i * 22;
      })
      .attr('fill', function (d) {
        if (d === 'other') {
          return 'hsla(0, 0%, 20%, 1)';
        }
        return groupColor(d);
      })
      .on('click', (_e, group) => {
        if (selectedGroup === group) {
          setSelectedGroup(null);
        } else {
          setSelectedGroup(group);
        }
      });

    g.selectAll('text')
      .data(groups)
      .enter()
      .append('text')
      .classed('group-legend', true)
      .classed('selected', (d) => selectedGroup === d)
      .attr('x', 15)
      .attr('y', function (d, i) {
        return i * 22 + 10;
      })
      .text(function (d) {
        return d;
      })
      .on('click', (_e, group) => {
        if (selectedGroup === group) {
          setSelectedGroup(null);
        } else {
          setSelectedGroup(group);
        }
      });
  };

  const renderXAxisLabel = useCallback(
    (xLabelElement: Selection<SVGGElement, unknown, HTMLElement, unknown>) => {
      // x axis label
      xLabelElement.selectAll('*').remove();
      xLabelElement.append('text').text(xLabel).classed('axis-title', true);
      xLabelElement.call(renderAxisScaleOptions, xScaleTypes, currentScaleType.x);

      // listeners to scale changes
      // these linsteners should be removed at element.selectAll('*').remove()
      xLabelElement
        .select('.scale-choice.linear')
        .on('click', () => setCurrentScaleType({ y: currentScaleType.y, x: 'linear' }));
      xLabelElement
        .select('.scale-choice.log')
        .on('click', () => setCurrentScaleType({ y: currentScaleType.y, x: 'log' }));
    },
    [renderAxisScaleOptions, xLabel, xScaleTypes, currentScaleType.x],
  );

  const renderYAxisLabel = useCallback(
    (yLabelElement: Selection<SVGGElement, unknown, HTMLElement, unknown>) => {
      // y axis label
      yLabelElement.selectAll('*').remove();
      yLabelElement.append('text').text(yLabel).classed('axis-title', true);
      yLabelElement.call(renderAxisScaleOptions, yScaleTypes, currentScaleType.y);

      // listeners to scale changes
      // these linsteners should be removed at element.selectAll('*').remove()
      yLabelElement
        .select('.scale-choice.linear')
        .on('click', () => setCurrentScaleType({ x: currentScaleType.x, y: 'linear' }));
      yLabelElement
        .select('.scale-choice.log')
        .on('click', () => setCurrentScaleType({ x: currentScaleType.x, y: 'log' }));
    },
    [renderAxisScaleOptions, yLabel, yScaleTypes, currentScaleType.y],
  );

  const renderFunction = useCallback(
    (svg: Selection<SVGSVGElement, unknown, HTMLElement, unknown>) => {
      // remove everything
      svg.selectAll('*').remove();
      d3.selectAll('.bubble-plot-tooltip').remove();

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

      renderXAxisLabel(xLabelElement);
      renderYAxisLabel(yLabelElement);

      // tooltip, only shown when mouse over node
      const tooltip = d3
        .select('body')
        .append('div')
        .classed('bubble-plot-tooltip', true)
        .style('position', 'absolute')
        .style('display', 'none');

      // Render nodes
      const papers = g
        .append('g')
        .selectAll<BaseType, IBubblePlotNodeData>('.paper-circle')
        .data(nodes, (n) => n.bibcode)
        .join('circle')
        .classed('paper-circle', true)
        .attr('r', (d) => `${rScale(d[rKey])}px`)
        .attr('cx', (d) => (currentScaleType.x === 'log' && d[xKey] === 0 ? 0 : xScale(d[xKey])))
        .attr('cy', (d) => (currentScaleType.y === 'log' && d[yKey] === 0 ? 0 : yScale(d[yKey])))
        .attr('stroke', 'black')
        .style('opacity', 0.7)
        .style('fill', (d) => (groups && groups.includes(d.pub) ? groupColor(d.pub) : 'gray'))
        .style('display', (d) =>
          (currentScaleType.x === 'log' && d[xKey] === 0) || (currentScaleType.y === 'log' && d[yKey] === 0) // hide invalid nodes (log(0))
            ? 'none'
            : 'block',
        );

      // tooltip event
      papers.on('mouseover', (event, node) => {
        const e = event as MouseEvent;
        if ((e.target as SVGAElement).classList.contains('paper-circle')) {
          //  find top 3 nodes with the same position
          const allData = d3
            .selectAll<BaseType, IBubblePlotNodeData>('.paper-circle')
            .filter(
              (d) =>
                (xKey === 'date' ? d[xKey].getTime() === node[xKey].getTime() : d[xKey] === node[xKey]) &&
                d[yKey] === node[yKey],
            )
            .sort((a, b) => b[rKey] - a[rKey])
            .data()
            .slice(0, 3);

          let html = '';
          allData.forEach((d) => {
            html += `<h5>${d.title}</h5>
          (${d.bibcode})</br>
          Citations: <b>${d.citation_count}</b>,
          Reads: <b>${d.read_count}</b><br/><br/>`;
          });

          tooltip
            .html(html)
            .style('display', 'block')
            .style('left', `${e.pageX + 20}px`)
            .style('top', `${e.pageY - 20}px`);
        }
      });

      papers.on('mouseleave.tooltip', () => {
        tooltip.style('display', 'none');
      });

      // Render group legend
      const legend = svg
        .append('g')
        .classed('legend-group-key', true)
        .attr('transform', `translate(${width + margin.left + 100}, ${height / 2})`);
      renderGroupLegend(legend);

      return svg;
    },
    [graph],
  );

  const { ref } = useD3(renderFunction, [renderFunction]);

  return <svg ref={ref} />;
};
