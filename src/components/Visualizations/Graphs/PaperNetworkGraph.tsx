import { useD3 } from '../useD3';
import * as d3 from 'd3';
import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { BaseType, D3ZoomEvent, HierarchyRectangularNode, Selection } from 'd3';
import { IADSApiAuthorNetworkNode, IADSApiPaperNetworkSummaryGraph, IADSApiPaperNetworkSummaryGraphNode } from '@api';
import { usePaperNetworkGraph } from './usePaperNetworkGraph';

export interface IPaperNetworkGraphProps {
  nodes_data: IADSApiPaperNetworkSummaryGraph['nodes'];
  links_data: IADSApiPaperNetworkSummaryGraph['links'];
  onClickNode: (node: IADSApiPaperNetworkSummaryGraphNode) => void;
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

const width = 300;

// const radius = width / 1.5;

const outerRadius = width * 0.33;

const innerRadius = width * 0.21;

export const PaperNetworkGraph = ({ nodes_data, links_data, onClickNode }: IPaperNetworkGraphProps): ReactElement => {
  const [selectedNode, setSelectedNode] = useState<IADSApiPaperNetworkSummaryGraphNode>();

  const { partition, arc, line, nodeFill, fontScale, linkScale } = usePaperNetworkGraph(
    nodes_data,
    links_data,
    innerRadius,
    outerRadius,
  );

  // when selected node has changed, update node on graph
  useEffect(() => {
    if (selectedNode) {
      onClickNode(selectedNode);
      // clear previous selection & highlight current selection
      d3.selectAll<BaseType, HierarchyRectangularNode<IADSApiPaperNetworkSummaryGraphNode>>('.node-path').classed(
        'selected-node',
        (d) => d.data.id === selectedNode.id,
      );
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
      stable_index: 0,
      id: 0,
      children: nodes_data,
    }),
    [nodes_data],
  );

  const graphNodesData = useMemo(() => partition(fake_root), [fake_root]);

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
      return source === target ? undefined : { weight: l.weight, source, target };
    });

    return links.filter((l) => l !== undefined);
  };

  const groupTicks: IGroupTick[] = useMemo(() => {
    return graphNodesData.children.map((d) => ({
      angle: (d.x0 + d.x1) / 2,
      label: d.data.node_label,
      data: d,
    }));
  }, [graphNodesData]);

  const getlabelsList = (d: IGroupTick) => {
    // word list
    // convert to [label, idf], sorted by highest idf, take the top 5
    const labels = Object.entries(d.label)
      .sort((a, b) => {
        return b[1] - a[1];
      })
      .slice(0, 5);

    return labels.map((label) => ({ label: label[0], value: label[1], id: d.data.data.id }));
  };

  // ---  rendering ----

  const renderLinkLayer = (g: Selection<SVGGElement, unknown, HTMLElement, unknown>) => {
    const links = parseLinks(links_data);

    const linkContainer = g.append('g'); //.classed('link-container', true);

    linkContainer
      .selectAll('path')
      .data(links)
      .join('path')
      .classed('link', true)
      .attr('d', (d) => line(d.source.path(d.target)))
      .attr('stroke', '#000')
      .attr('stroke-opacity', '20%')
      .attr('fill', 'none')
      .attr('stroke-width', (d) => linkScale(d.weight));
  };

  const renderFunction = useCallback(
    (svg: Selection<SVGSVGElement, unknown, HTMLElement, any>) => {
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
        .data(graphNodesData.descendants().slice(1)) // exclude the fake root
        .join('path')
        .classed('node-path', true)
        .attr('fill', nodeFill)
        .attr('fill-opacity', 0.8)
        .attr('pointer-events', 'auto')
        .attr('d', arc) // the shape to draw
        .on('click', (e, p) => {
          setSelectedNode(p.data);
        });

      // links
      renderLinkLayer(g);

      // labels
      const labelSum: number[] = [];

      const ticks = g
        .selectAll('.groupLabel')
        .data(groupTicks)
        .enter()
        .append('g')
        .each((d) => labelSum.push(d.data.value))
        .classed('groupLabel', true)
        .attr('transform', (d) => `rotate(${(d.angle * 180) / Math.PI - 90}) translate(${(outerRadius * 1) / 1},0)`);

      const sum = d3.sum(labelSum);

      // labels
      const text = ticks
        .append('g')
        .attr('x', 0)
        .attr('dy', '.5em')
        .attr('transform', (d) => `rotate(${-((d.angle * 180) / Math.PI - 90)})`)
        .classed('summary-label-container', true)
        .classed('hidden', (d) => d.data.value / sum < 0.08)
        .selectAll('text')
        .data(getlabelsList)
        .enter()
        .append('text')
        .attr('x', 0)
        .classed('paper-network-labels', true)
        .attr('text-anchor', 'middle')
        .attr('y', (d, i) => {
          // y position for each word
          const size = nodes_data.find((n) => n.id === d.id).paper_count;
          return i * fontScale(size) - 30;
        })
        .attr('font-size', (d) => {
          const size = nodes_data.find((n) => n.id === d.id).paper_count;
          return `${fontScale(size)}px`;
        })
        .text((d) => d.label);

      return svg;
    },
    [nodes_data],
  );

  const { ref } = useD3(renderFunction, [renderFunction]);

  return <svg ref={ref} />;
};
