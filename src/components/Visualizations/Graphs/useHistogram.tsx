import * as d3 from 'd3';
import { HistogramDatum } from '../types';

export interface IUseHistogramProps {
  histogramData: HistogramDatum[];
  width: number;
  height: number;
}

export const useHistogram = ({ histogramData: data, width, height }: IUseHistogramProps) => {
  // X scale function
  const xScale = d3
    .scaleLinear()
    .domain([data[0].x, data[data.length - 1].x + 1])
    .range([0, width]);

  // y scale function
  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.y)])
    .range([height, 0]);

  // histogram bin function
  const histogram = d3
    .bin()
    .domain([data[0].x, data[data.length - 1].x])
    .thresholds(xScale.ticks(data.length));

  return { xScale, yScale, histogram };
};
