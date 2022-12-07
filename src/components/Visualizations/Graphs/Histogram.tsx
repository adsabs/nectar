import { useD3 } from './useD3';
import * as d3 from 'd3';
import { Selection } from 'd3';
import { useCallback, useEffect } from 'react';
import { Margin } from '../types';

export interface IHistogramProps {
  data: { x: number; y: number }[];
  highlightDomain?: [number, number];
  showXAxis?: boolean;
  showYAxis?: boolean;
  margin?: Margin;
  w: number;
  h: number;
}

export const Histogram = ({
  data,
  highlightDomain = [data[0].x, data[data.length - 1].x],
  showXAxis = true,
  showYAxis = true,
  margin = { top: 0, right: 0, bottom: showXAxis ? 40 : 0, left: showYAxis ? 40 : 0 },
  w,
  h,
}: IHistogramProps) => {
  // set the dimensions and margins of the graph
  const width = w - margin.left - margin.right;
  const height = h - margin.top - margin.bottom;

  // X scale function
  const xScale = d3
    .scaleLinear()
    .domain([data[0].x, data[data.length - 1].x])
    .range([0, width]);

  // y scale function
  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.y)])
    .range([height, 0]);

  // histogram bin function
  const histogram = d3
    .bin()
    .value((d) => d.y)
    .domain([data[0].x, data[data.length - 1].x])
    .thresholds(xScale.ticks(data.length));

  // And apply this function to data to get the bins
  const bins = histogram(data);

  // selected range changed, update bin color
  useEffect(() => {
    d3.selectAll('.histogram-bin').style('fill', (d, i) =>
      data[i].x < highlightDomain[0] || data[i].x > highlightDomain[1] ? 'gray' : '#69b3a2',
    );
  }, [highlightDomain]);

  const renderFunction = useCallback(
    (svg: Selection<SVGSVGElement, unknown, HTMLElement, unknown>) => {
      // remove everything
      svg.selectAll('*').remove();

      // append the svg object to the body of the page
      const g = svg
        .attr('width', w)
        .attr('height', h)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // x axis
      if (showXAxis) {
        g.append('g').attr('transform', `translate(0, ${height})`).call(d3.axisBottom(xScale));
      }

      // y axis
      if (showYAxis) {
        g.append('g').call(d3.axisLeft(yScale));
      }

      // append the bar rectangles to the svg element
      g.selectAll('rect')
        .data(bins)
        .join('rect')
        .classed('histogram-bin', true)
        .attr('x', 1)
        .attr('transform', function (d, i) {
          return `translate(${xScale(d.x0)} , ${yScale(data[i].y)})`;
        })
        .attr('width', function (d) {
          const w = xScale(d.x1) - xScale(d.x0);
          return w;
        })
        .attr('height', function (d, i) {
          return height - yScale(data[i].y);
        })
        .style('fill', (d, i) =>
          data[i].x < highlightDomain[0] || data[i].x > highlightDomain[1] ? 'gray' : '#69b3a2',
        );

      return svg;
    },
    [data],
  );

  const { ref } = useD3(renderFunction, [renderFunction]);

  return <svg ref={ref} />;
};
