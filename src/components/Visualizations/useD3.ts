import React from 'react';
import * as d3 from 'd3';
import { Selection } from 'd3';

export const useD3 = (
  renderFn: (
    svg: Selection<SVGSVGElement, unknown, HTMLElement, any>,
  ) => Selection<SVGSVGElement, unknown, HTMLElement, any>,
  dependencies: React.DependencyList,
) => {
  const ref = React.useRef<SVGSVGElement>();
  const svg = React.useRef<Selection<SVGSVGElement, unknown, HTMLElement, any>>();

  React.useEffect(() => {
    svg.current = renderFn(d3.select(ref.current));
  }, dependencies);
  return { ref, svg };
};
