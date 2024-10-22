import { useColorMode } from '@chakra-ui/react';
import * as d3 from 'd3';
import { HierarchyRectangularNode } from 'd3';
import { pluck } from 'ramda';
import { useCallback, useMemo } from 'react';
import {
  IADSApiPaperNetworkNodeKey,
  IADSApiPaperNetworkSummaryGraph,
  IADSApiPaperNetworkSummaryGraphNode,
} from '@/api/vis/types';

export const usePaperNetworkGraph = (
  nodes_data: IADSApiPaperNetworkSummaryGraph['nodes'],
  links_data: IADSApiPaperNetworkSummaryGraph['links'],
  keyToUseAsValue: IADSApiPaperNetworkNodeKey,
  innerRadius: number,
  outerRadius: number,
) => {
  const partition = useCallback(
    (data: IADSApiPaperNetworkSummaryGraphNode & { children: IADSApiPaperNetworkSummaryGraphNode[] }) => {
      // data to node in tree structure
      const root = d3
        .hierarchy(data)
        .sum((d) => (d[keyToUseAsValue] ? d[keyToUseAsValue] : 0))
        .sort((a, b) => a.data.node_name - b.data.node_name);
      const p = d3.partition<IADSApiPaperNetworkSummaryGraphNode>().size([2 * Math.PI, +root.height + 1])(root); // add x (angle), y (distance) to tree structure
      return p;
    },
    [keyToUseAsValue],
  );

  const arc = d3
    .arc<HierarchyRectangularNode<IADSApiPaperNetworkSummaryGraphNode>>()
    .startAngle((d) => d.x0)
    .endAngle((d) => d.x1)
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

  const noGroupColor = '#a6a6a6';

  const line = d3
    .lineRadial<HierarchyRectangularNode<IADSApiPaperNetworkSummaryGraphNode>>()
    .curve(d3.curveBundle.beta(0.2))
    .radius(innerRadius + 10)
    .angle((d) => (d.x0 + d.x1) / 2);

  // use the same color scheme (category10) as Nivo graphs so they will match the corresponding line graph
  const nodeFill = (d: HierarchyRectangularNode<IADSApiPaperNetworkSummaryGraphNode>): string =>
    d.depth === 0 ? 'white' : d.data.node_name > 7 ? noGroupColor : d3.schemeCategory10[d.data.node_name - 1];

  const values = useMemo(() => pluck(keyToUseAsValue, nodes_data), [nodes_data, keyToUseAsValue]);

  const fontScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([d3.min(values), d3.max(values)])
      .range([9, 14]);
  }, [values]);

  const weights = useMemo(() => {
    return links_data.map((l) => (l.source !== l.target ? l.weight : undefined)).filter((l) => l !== undefined);
  }, [links_data]);

  const linkScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([d3.min(weights), d3.max(weights)])
      .range([3, 22]);
  }, [weights]);

  const { colorMode } = useColorMode();

  return {
    partition,
    arc,
    line,
    nodeFill,
    fontScale,
    linkScale,
    textColor: colorMode === 'light' ? '#000000' : '#ffffff',
  };
};
