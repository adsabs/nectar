import React from 'react';
import * as d3 from 'd3';
import { Selection } from 'd3';

export const useD3 = (
  renderFn: (
    svg: Selection<SVGSVGElement, unknown, HTMLElement, unknown>,
  ) => Selection<SVGSVGElement, unknown, HTMLElement, unknown>,
  dependencies: React.DependencyList,
) => {
  const ref = React.useRef<SVGSVGElement>();

  React.useEffect(() => {
    renderFn(d3.select(ref.current));
  }, dependencies);
  return { ref };
};
