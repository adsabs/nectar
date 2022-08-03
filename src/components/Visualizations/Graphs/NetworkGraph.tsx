import { useD3 } from '../useD3';
import * as d3 from 'd3';
import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { BaseType, D3ZoomEvent, HierarchyRectangularNode, Selection } from 'd3';
import { IADSApiVisNode, IADSApiVisNodeKey } from '@api';
import { useNetworkGraph } from './useNetworkGraph';
export interface INetworkGraphProps {
  root: IADSApiVisNode;
  link_data: number[][];
  showLinkLayer: boolean;
  onClickNode: (node: IADSApiVisNode) => void;
  keyToUseAsValue: IADSApiVisNodeKey;
}

export interface NetworkHierarchyNode<Datum> extends HierarchyRectangularNode<Datum> {
  color: string; // cache color data
}

export interface ADSSVGPathElement extends SVGPathElement {
  lastAngle: { x0: number; x1: number };
}
export interface ILink {
  source: NetworkHierarchyNode<IADSApiVisNode>;
  target: NetworkHierarchyNode<IADSApiVisNode>;
  weight: number;
}

const width = 932;

const radius = width / 10;

const numberOfLabelsToShow = 100;

const noGroupColor = '#a6a6a6';

export const NetworkGraph = ({
  root,
  link_data,
  showLinkLayer,
  onClickNode,
  keyToUseAsValue,
}: INetworkGraphProps): ReactElement => {
  const [selectedNode, setSelectedNode] = useState<IADSApiVisNode>();

  const { partition, arc, color, fontSize, line, citationLimit, readLimit, linkScale, labelTransform, textAnchor } =
    useNetworkGraph(root, link_data, keyToUseAsValue, radius, numberOfLabelsToShow);

  // actaul tree root data for graph
  const graphRoot = useMemo(() => partition(root), [partition, root]);

  // get color of node
  const nodeFill = (d: NetworkHierarchyNode<IADSApiVisNode>) => {
    if (d.depth === 0) {
      return 'white';
    }
    if (d.depth === 1) {
      const index = d.parent.children.indexOf(d);
      if (index < 7) {
        d.color = color(index.toString());
        return d.color;
      }
      return noGroupColor;
    }
    if (d.depth === 2) {
      // child nodes
      if (!d.parent.color) {
        return noGroupColor;
      }
      return d.parent.color;
    }
  };

  // get the label's display setting based on type of view
  const labelDisplay = (d: NetworkHierarchyNode<IADSApiVisNode>, key: string) => {
    if (key == 'size') {
      return 'block';
    }
    if (key == 'citation_count' && d.data.citation_count > citationLimit) {
      return 'block';
    }
    if (key == 'read_count' && d.data.read_count > readLimit) {
      return 'block';
    }
    return 'none';
  };

  // get link stroke width
  const strokeWidth = (d: ILink, links: ILink[]) => {
    // get link weight
    const weight = links.filter((l) => {
      return (
        (l.source.data.name === d.source.data.name && l.target.data.name === d.target.data.name) ||
        (l.target.data.name === d.source.data.name && l.source.data.name === d.target.data.name)
      );
    })[0].weight;
    return linkScale(weight);
  };

  // node linking data
  const getLinks = (linkData: number[][]) => {
    return linkData.map((l) => {
      const source = d3
        .selectAll<BaseType, NetworkHierarchyNode<IADSApiVisNode>>('.node-path')
        .filter((d) => d.data.numberName === l[0])
        .data()[0];
      const target = d3
        .selectAll<BaseType, NetworkHierarchyNode<IADSApiVisNode>>('.node-path')
        .filter((d) => d.data.numberName === l[1])
        .data()[0];

      const weight = l[2];
      return { source, target, weight };
    });
  };

  // transition nodes for view change
  const transitionNodePaths = (root: NetworkHierarchyNode<IADSApiVisNode>) => {
    d3.selectAll<ADSSVGPathElement, unknown>('.node-path')
      .data(root.descendants().slice(1))
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
  const transitionNodeLabels = (root: NetworkHierarchyNode<IADSApiVisNode>, key: IADSApiVisNodeKey) => {
    d3.selectAll('.node-label')
      .join('text')
      .data(root.descendants().slice(1))
      .attr('opacity', '0')
      .style('display', (d) => labelDisplay(d, key))
      .style('font-size', (d) => fontSize(d, key))
      .attr('transform', labelTransform)
      .attr('text-anchor', textAnchor)
      .transition()
      .duration(1500)
      .attr('opacity', 1);
  };

  // transition links for view change
  const transitionLinks = (links: ILink[]) => {
    d3.selectAll('.link-container')
      .selectAll<BaseType, ILink>('.link')
      .data(links)
      .join('path')
      .transition()
      .duration(1500)
      .attr('d', (d) => line(d.source.path(d.target)));
  };

  // link layer toggled, show/hide link layer
  useEffect(() => {
    if (showLinkLayer) {
      // show link layer
      d3.selectAll('.link-container').style('display', 'block');
    } else {
      // hide link layer
      d3.selectAll('.link-container').style('display', 'none');
    }
  }, [showLinkLayer]);

  // handle mouse over label
  const handleMouseOverLabel = useCallback(
    (e, n: NetworkHierarchyNode<IADSApiVisNode>) => {
      if (!showLinkLayer) {
        return;
      }

      // highlight links
      const highlightedLinks = d3
        .selectAll<BaseType, ILink>('.link')
        .filter((l) => l.source.data.name === n.data.name || l.target.data.name === n.data.name)
        .classed('selected-link', true);

      // highlight labels
      const highlightedLabelNames = new Set();
      highlightedLinks.each((hl) => {
        highlightedLabelNames.add(hl.source.data.name);
        highlightedLabelNames.add(hl.target.data.name);
      });

      d3.selectAll<BaseType, NetworkHierarchyNode<IADSApiVisNode>>('.node-label')
        .filter((nl) => highlightedLabelNames.has(nl.data.name))
        .classed('linked-label', true);
    },
    [showLinkLayer],
  );

  // handle mouse over link
  const handleMouseOverLink = useCallback(
    (e, link: ILink) => {
      if (!showLinkLayer) {
        return;
      }

      // highlight link
      const highlightedLinks = d3
        .selectAll<BaseType, ILink>('.link')
        .filter((l) => l.source.data.name === link.source.data.name && l.target.data.name === link.target.data.name)
        .classed('selected-link', true);

      // labels of the highlighted link
      const highlightedLabelNames = new Set();
      highlightedLinks.each((hl) => {
        highlightedLabelNames.add(hl.source.data.name);
        highlightedLabelNames.add(hl.target.data.name);
      });

      d3.selectAll<BaseType, NetworkHierarchyNode<IADSApiVisNode>>('.node-label')
        .filter((nl) => highlightedLabelNames.has(nl.data.name))
        .classed('linked-label', true);
    },
    [showLinkLayer],
  );

  // when mouseover callbacks are updated, update graph elements
  useEffect(() => {
    d3.selectAll<BaseType, NetworkHierarchyNode<IADSApiVisNode>>('.node-label').on('mouseover', handleMouseOverLabel);
  }, [handleMouseOverLabel]);

  useEffect(() => {
    d3.selectAll('.link-container').selectAll<BaseType, ILink>('.link').on('mouseover', handleMouseOverLink);
  }, [handleMouseOverLink]);

  // when selected node has changed, update node on graph
  useEffect(() => {
    if (selectedNode) {
      onClickNode(selectedNode);
      // clear previous selection & highlight current selection
      d3.selectAll<BaseType, NetworkHierarchyNode<IADSApiVisNode>>('.node-path').classed(
        'selected-node',
        (d) => !showLinkLayer && d.data.name === selectedNode.name,
      );
    }
  }, [selectedNode, showLinkLayer]);

  // When view changes, transition elements on graph
  useEffect(() => {
    transitionNodePaths(graphRoot);
    transitionNodeLabels(graphRoot, keyToUseAsValue);
    transitionLinks(getLinks(link_data));
  }, [graphRoot]);

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
        .on('zoom', (e: D3ZoomEvent<SVGGElement, IADSApiVisNode>) => {
          g.attr('transform', e.transform.toString());
        });
      g0.call(zoom);
      g0.on('dblclick.zoom', null);

      // Nodes
      g.append('g')
        .selectAll<ADSSVGPathElement, unknown>('path')
        .data(graphRoot.descendants().slice(1)) // flattened nodes, exclude the root itself
        .join<ADSSVGPathElement>('path')
        .classed('node-path', (d) => d.depth !== 0)
        .attr('fill', nodeFill)
        .attr('fill-opacity', 0.8)
        .attr('pointer-events', 'auto')
        .attr('d', arc) // the shape to draw
        .each(function (d) {
          this.lastAngle = { x0: d.x0, x1: d.x1 };
        }) // save this angle for use in transition interpolation
        .on('click', (e, p) => {
          setSelectedNode(p.data);
        });

      // node labels
      g.append('g')
        .selectAll('text')
        .data(graphRoot.descendants().slice(1))
        .join('text')
        .classed('node-label', true)
        .attr('dy', '0.35em')
        .attr('fill-opacity', 1)
        .attr('transform', labelTransform)
        .style('font-size', (d) => fontSize(d, keyToUseAsValue))
        .style('display', (d) => labelDisplay(d, keyToUseAsValue))
        .text((d) => (d.depth === 2 ? (d.data.name as string) : null))
        .attr('text-anchor', textAnchor)
        .on('mouseover', handleMouseOverLabel)
        .on('mouseout', () => {
          // remove highlights
          g.selectAll('.link').classed('selected-link', false);
          g.selectAll('.node-label').classed('linked-label', false);
        })
        .on('click', (e, p) => {
          setSelectedNode(p.data);
        });

      // Link overlay layer
      const linkContainer = g
        .append('g')
        .classed('link-container', true)
        .style('display', showLinkLayer ? 'block' : 'none');

      // Overlay on top of circle
      linkContainer
        .append('circle')
        .attr('r', radius * 3) // depths = 3, each level has radius, so 3 * radius
        .style('fill', 'rgba(255, 255, 255, 0.5)');

      // get links data
      const links = getLinks(link_data);

      // links
      linkContainer
        .selectAll('path')
        .data(links)
        .join('path')
        .classed('link', true)
        .attr('d', (d) => line(d.source.path(d.target)))
        .attr('stroke', '#000')
        .attr('stroke-opacity', '40%')
        .attr('fill', 'none')
        .style('transition', 'opacity 0.6s ease, transform 0.6s ease')
        .attr('stroke-width', (d) => strokeWidth(d, links))
        .on('mouseover', handleMouseOverLink)
        .on('mouseout', () => {
          // remove highlights
          g.selectAll('.link').classed('selected-link', false);
          g.selectAll('.node-label').classed('linked-label', false);
        });

      return svg;
    },
    [root, link_data],
  );

  const { ref } = useD3(renderFunction, [renderFunction]);

  return <svg ref={ref} />;
};
