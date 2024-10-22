import { useD3 } from './useD3';
import * as d3 from 'd3';
import { BaseType, D3ZoomEvent, HierarchyRectangularNode, Selection } from 'd3';
import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';

import { usePaperNetworkGraph } from './usePaperNetworkGraph';
import { ADSSVGPathElement } from './types';
import {
  IADSApiAuthorNetworkNode,
  IADSApiPaperNetworkNodeKey,
  IADSApiPaperNetworkSummaryGraph,
  IADSApiPaperNetworkSummaryGraphNode,
} from '@/api/vis/types';

export interface IPaperNetworkGraphProps {
  nodesData: IADSApiPaperNetworkSummaryGraph['nodes'];
  linksData: IADSApiPaperNetworkSummaryGraph['links'];
  onClickNode: (node: IADSApiPaperNetworkSummaryGraphNode) => void;
  onClickLink: (
    source: IADSApiPaperNetworkSummaryGraphNode,
    sourceColor: string,
    target: IADSApiPaperNetworkSummaryGraphNode,
    targetColor: string,
  ) => void;
  keyToUseAsValue: IADSApiPaperNetworkNodeKey;
}

interface ILink {
  source: HierarchyRectangularNode<IADSApiPaperNetworkSummaryGraphNode>;
  target: HierarchyRectangularNode<IADSApiPaperNetworkSummaryGraphNode>;
  weight: number;
}

interface IGroupTick {
  angle: number;
  label: IADSApiPaperNetworkSummaryGraphNode['node_label'];
  data: HierarchyRectangularNode<IADSApiPaperNetworkSummaryGraphNode>;
}

interface ILabel {
  label: string;
  value: number;
  // id: number;
  node: IADSApiPaperNetworkSummaryGraphNode;
}

const width = 500;

const outerRadius = width * 0.33;

const innerRadius = width * 0.21;

export const PaperNetworkGraph = ({
  nodesData,
  linksData,
  onClickNode,
  onClickLink,
  keyToUseAsValue,
}: IPaperNetworkGraphProps): ReactElement => {
  const [selectedNode, setSelectedNode] = useState<IADSApiPaperNetworkSummaryGraphNode | ILink>();

  const { partition, arc, line, nodeFill, fontScale, linkScale, textColor } = usePaperNetworkGraph(
    nodesData,
    linksData,
    keyToUseAsValue,
    innerRadius,
    outerRadius,
  );

  // when selected node has changed, update node on graph
  useEffect(() => {
    if (selectedNode) {
      if ('id' in selectedNode) {
        // selected group
        onClickNode(selectedNode);

        // clear previous selection & highlight current selection
        d3.selectAll<BaseType, HierarchyRectangularNode<IADSApiPaperNetworkSummaryGraphNode>>('.node-path').classed(
          'selected-node',
          (d) => d.data.id === selectedNode.id,
        );

        // clear all link highlights
        d3.selectAll<BaseType, ILink>('.link').classed('selected', false);
      } else {
        // selected link
        onClickLink(
          selectedNode.source.data,
          nodeFill(selectedNode.source),
          selectedNode.target.data,
          nodeFill(selectedNode.target),
        );

        // clear all group highlights
        d3.selectAll<BaseType, HierarchyRectangularNode<IADSApiPaperNetworkSummaryGraphNode>>('.node-path').classed(
          'selected-node',
          false,
        );

        // clear and set link highlights
        d3.selectAll<BaseType, ILink>('.link').classed(
          'selected',
          (d) => d.source.data.id === selectedNode.source.data.id && d.target.data.id === selectedNode.target.data.id,
        );
      }
    }
  }, [selectedNode]);

  // our data is one level (list), make a fake root to use partition hierarchy
  const fake_root: IADSApiPaperNetworkSummaryGraphNode & { children: IADSApiPaperNetworkSummaryGraphNode[] } = useMemo(
    () => ({
      paper_count: 0,
      node_label: {},
      total_citations: 0,
      node_name: 0,
      top_common_references: {},
      total_reads: 0,
      stable_index: 99999,
      id: 99999,
      children: nodesData,
    }),
    [nodesData],
  );

  const graphRoot = useMemo(() => partition(fake_root), [partition, fake_root]);

  // build graph links from links data
  const parseLinks = (links_data: IADSApiPaperNetworkSummaryGraph['links']): ILink[] => {
    const links = links_data.map((l) => {
      const source = d3
        .selectAll<BaseType, HierarchyRectangularNode<IADSApiPaperNetworkSummaryGraphNode>>('.node-path')
        .filter((d) => d.data.stable_index === l.source)
        .data()[0];

      const target = d3
        .selectAll<BaseType, HierarchyRectangularNode<IADSApiPaperNetworkSummaryGraphNode>>('.node-path')
        .filter((d) => d.data.stable_index === l.target)
        .data()[0];

      // ignore self links
      return source === target || source === undefined || target === undefined
        ? undefined
        : { weight: l.weight, source, target };
    });

    return links.filter((l) => l !== undefined);
  };

  const groupTicks: IGroupTick[] = useMemo(() => {
    return graphRoot.children.map((d) => ({
      angle: (d.x0 + d.x1) / 2,
      label: d.data.node_label,
      data: d,
    }));
  }, [graphRoot]);

  const getlabelsList = (d: IGroupTick): ILabel[] =>
    // word list
    // convert to [label, idf], sorted by highest idf, take the top 5
    Object.entries(d.label)
      .sort((a, b) => {
        return b[1] - a[1];
      })
      .slice(0, 5)
      .map((label) => ({ label: label[0], value: label[1], node: d.data.data }));

  // transition nodes for view change
  const transitionNodePaths = (root: HierarchyRectangularNode<IADSApiPaperNetworkSummaryGraphNode>) => {
    d3.selectAll<ADSSVGPathElement, unknown>('.node-path')
      .data(root.descendants())
      .join<ADSSVGPathElement>('path')
      .transition()
      .duration(1500)
      .attrTween('d', function (d) {
        const i = d3.interpolateObject(this.lastAngle, d);
        this.lastAngle = { x0: d.x0, x1: d.x1 }; // cache current angle
        return (t: number) => {
          return arc(i(t));
        };
      });
  };

  // transition node labels for view change
  const transitionNodeLabels = useCallback(
    (groupTicks: IGroupTick[], key: IADSApiPaperNetworkNodeKey) => {
      const labelvalues: number[] = [];
      groupTicks.forEach((d) => labelvalues.push(d.data.value));
      const labelSum = d3.sum(labelvalues);

      // position
      const groups = d3
        .selectAll('.groupLabel')
        .data(groupTicks)
        .transition()
        .duration(1000)
        .attr('transform', (d) => `rotate(${(d.angle * 180) / Math.PI - 90}) translate(${(outerRadius * 1) / 1},0)`);

      // angle
      d3.selectAll<BaseType, IGroupTick>('.summary-label-container')
        .data(groupTicks)
        .classed('hidden', (d) => d.data.value / labelSum < 0.08)
        .transition()
        .duration(1000)
        .attr('transform', (d) => `rotate(${-((d.angle * 180) / Math.PI - 90)})`);

      // size
      groups
        .selectAll<BaseType, ILabel>('text')
        .attr('y', function (d, i) {
          // y position for each word
          const size = d.node[key];
          return i * fontScale(size) - 30;
        })
        .attr('font-size', (d) => {
          const size = d.node[key];
          return `${fontScale(size)}px`;
        });
    },
    [fontScale],
  );

  // transition links for view change
  const transitionLinks = useCallback(
    (links: ILink[]) => {
      d3.selectAll('.link-container')
        .selectAll('.link')
        .data(links)
        .join('path')
        .transition()
        .duration(1000)
        .attr('d', (d) => {
          return line(d.source.path(d.target));
        });
    },
    [line],
  );

  // When view changes, transition elements on graph
  useEffect(() => {
    transitionNodePaths(graphRoot);
    transitionLinks(parseLinks(linksData));
  }, [graphRoot]);

  useEffect(() => {
    transitionNodeLabels(groupTicks, keyToUseAsValue);
  }, [groupTicks]);

  // ---  rendering ----

  const renderFunction = useCallback(
    (svg: Selection<SVGSVGElement, unknown, HTMLElement, unknown>) => {
      svg.selectAll('*').remove();

      svg.attr('viewBox', [0, 0, width, width]).style('font', '10px sans-serif').classed('network-graph-svg', true);

      const g0 = svg.append('g').attr('transform', `translate(${width / 2},${width / 2})`);

      const g = g0.append('g').classed('network-graph-container', true);

      // zoom behavior
      const zoom = d3
        .zoom<SVGGElement, unknown>()
        .scaleExtent([0.7, 3])
        .on('zoom', (e: D3ZoomEvent<SVGGElement, IADSApiAuthorNetworkNode>) => {
          g.attr('transform', e.transform.toString());
        });
      g0.call(zoom);
      g0.on('dblclick.zoom', null);

      // Nodes
      g.selectAll('path')
        .data(graphRoot.descendants()) // exclude the fake root
        .join('path')
        .classed('node-path', true)
        .attr('id', (p) => `group-id-${p.data.id}`)
        .attr('fill', nodeFill)
        .attr('fill-opacity', 0.8)
        .attr('pointer-events', 'auto')
        .attr('d', arc) // the shape to draw
        .on('click', (e, p) => setSelectedNode(p.data));

      // links
      const links = parseLinks(linksData);
      const linkContainer = g.append('g').classed('link-container', true);

      linkContainer
        .selectAll('path')
        .data(links)
        .join('path')
        .classed('link', true)
        .attr('d', (d) => line(d.source.path(d.target)))
        .attr('stroke', textColor)
        .attr('stroke-opacity', '20%')
        .attr('fill', 'none')
        .attr('stroke-width', (d) => linkScale(d.weight))
        .attr('tabindex', 0)
        .on('click', (e, p) => setSelectedNode(p))
        .on('keypress', (e: KeyboardEvent, p) => {
          if (e.key === 'Enter') {
            setSelectedNode(p);
          }
        });

      // labels
      const labeValues: number[] = [];

      const ticks = g
        .selectAll('.groupLabel')
        .data(groupTicks)
        .join('g')
        .each((d) => labeValues.push(d.data.value))
        .classed('groupLabel', true)
        .attr('transform', (d) => `rotate(${(d.angle * 180) / Math.PI - 90}) translate(${(outerRadius * 1) / 1},0)`);

      const labelSum = d3.sum(labeValues);

      // labels
      ticks
        .append('g')
        .attr('x', 0)
        .attr('dy', '.5em')
        .attr('transform', (d) => `rotate(${-((d.angle * 180) / Math.PI - 90)})`)
        .classed('summary-label-container', true)
        .classed('hidden', (d) => d.data.value / labelSum < 0.08)
        .selectAll('text')
        .data(getlabelsList)
        .join('text')
        .attr('x', 0)
        .classed('paper-network-label', true)
        .attr('text-anchor', 'middle')
        .attr('y', (d, i) => {
          // y position for each word
          const size = d.node[keyToUseAsValue];
          return i * fontScale(size) - 30;
        })
        .attr('font-size', (d) => {
          const size = d.node[keyToUseAsValue];
          return `${fontScale(size)}px`;
        })
        .attr('tabindex', 0)
        .style('fill', textColor)
        .text((d) => d.label)
        .on('click', (e, d) => setSelectedNode(d.node))
        .on('keypress', (e: KeyboardEvent, d) => {
          if (e.key === 'Enter') {
            setSelectedNode(d.node);
          }
        });

      return svg;
    },
    [linksData, textColor],
  );

  const { ref } = useD3(renderFunction, [renderFunction]);

  return <svg ref={ref} />;
};
