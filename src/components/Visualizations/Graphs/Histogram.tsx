import { useD3 } from './useD3';
import * as d3 from 'd3';
import { Selection } from 'd3';
import { useCallback, useEffect, useMemo } from 'react';
import { HistogramDatum, Margin } from '../types';
import { noop } from '@/utils';
import { useHistogram } from './useHistogram';

export interface IHistogramProps {
  data: HistogramDatum[];
  highlightDomain?: [number, number];
  showXAxis?: boolean;
  showYAxis?: boolean;
  margin?: Margin;
  w: number;
  h: number;
  onClick?: (x: number) => void;
  onBarWidthReady?: (w: number) => void;
}

export const Histogram = ({
  data,
  highlightDomain = [data[0].x, data[data.length - 1].x],
  showXAxis = true,
  showYAxis = true,
  margin = { top: 0, right: 0, bottom: showXAxis ? 40 : 0, left: showYAxis ? 40 : 0 },
  w,
  h,
  onClick = noop,
  onBarWidthReady,
}: IHistogramProps) => {
  // set the dimensions and margins of the graph
  const width = w - margin.left - margin.right;
  const height = h - margin.top - margin.bottom;

  const { xScale, yScale, histogram } = useHistogram({ histogramData: data, width, height });

  // And apply this function to data to get the bins
  const bins = useMemo(() => {
    const t = histogram(data.map((d) => d.x));
    // need to add 1 to last bin's upper bound
    t[t.length - 1].x1 = t[t.length - 1].x0 + 1;
    return t;
  }, [histogram, data]);

  const barWidth = useMemo(() => xScale(bins[0].x1) - xScale(bins[0].x0), [xScale, bins]);

  useEffect(() => {
    if (onBarWidthReady) {
      onBarWidthReady(barWidth);
    }
  }, [barWidth]);

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
      d3.selectAll('.histogram-tooltip').remove();

      svg.classed('histogram-svg', true);

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

      // tooltip, only shown when mouse over node
      const tooltip = d3
        .select('body')
        .append('div')
        .classed('histogram-tooltip', true)
        .style('position', 'absolute')
        .style('display', 'none');

      // histogram bins
      g.selectAll('.histogram-bin')
        .data(bins)
        .join('rect')
        .classed('histogram-bin', true)
        .attr('x', 1)
        .attr('transform', (d, i) => `translate(${xScale(d.x0)} , ${yScale(data[i].y)})`)
        .attr('width', (d) => xScale(d.x1) - xScale(d.x0))
        .attr('height', (d, i) => height - yScale(data[i].y))
        .style('fill', (d, i) =>
          data[i].x < highlightDomain[0] || data[i].x > highlightDomain[1] ? 'gray' : '#69b3a2',
        );

      // Use this transparent layer above histogram for tooltips
      g.selectAll('.histogram-tooltip')
        .data(bins)
        .join('rect')
        .attr('x', 1)
        .attr('transform', (d) => `translate(${xScale(d.x0)} , 0)`)
        .attr('width', (d) => xScale(d.x1) - xScale(d.x0))
        .attr('height', height)
        .style('fill', '#fff')
        .style('opacity', 0) // make it transparent
        .on('mouseover', (event, bin) => {
          const e = event as MouseEvent;
          // find from data the matching x
          const { x, y } = data.find((d) => d.x === bin.x0);
          tooltip.transition().duration(100).style('display', 'block');
          tooltip
            .html(`${x}: ${y}`)
            .style('left', `${e.x + 10}px`)
            .style('top', `${e.y + 10}px`);
        })
        .on('mouseleave', () => {
          tooltip.transition().duration(100).style('display', 'none');
        })
        .on('click', (e, bin) => {
          const { x } = data.find((d) => d.x === bin.x0);
          onClick(x);
        })
        .style('cursor', 'pointer');

      return svg;
    },
    [histogram],
  );

  const { ref } = useD3(renderFunction, [renderFunction]);

  return <svg ref={ref} />;
};
