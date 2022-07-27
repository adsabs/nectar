import { useD3 } from '../useD3';
import * as d3 from 'd3';
import { ReactElement, useCallback, useEffect, useMemo } from 'react';
import { BaseType, D3ZoomEvent, HierarchyRectangularNode, Selection } from 'd3';
import { IADSApiVisNode, IADSApiVisNodeKey } from '@api';
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
  const { sizes, citation_counts, read_counts } = useMemo(() => {
    const sizes: number[] = [];
    const citation_counts: number[] = [];
    const read_counts: number[] = [];
    root.children?.forEach((g) => {
      g.children?.forEach((c) => {
        sizes.push(c.size);
        citation_counts.push(c.citation_count);
        read_counts.push(c.read_count);
      });
    });
    return { sizes, citation_counts, read_counts };
  }, [root]);

  // when the ring sizing is by citation, how many labels should be shown?
  const citationLimit = citation_counts[numberOfLabelsToShow] || citation_counts[citation_counts.length - 1];
  // when the ring sizing is by reads, how many labels should be shown?
  const readLimit = read_counts[numberOfLabelsToShow] || read_counts[read_counts.length - 1];

  // function that converts ADDS tree node (root) to hierachical tree node for graph
  const partition = useCallback(
    (data: IADSApiVisNode) => {
      // data to node in tree structure
      const root = d3
        .hierarchy<IADSApiVisNode>(data)
        .sum((d) => (d[keyToUseAsValue] ? (d[keyToUseAsValue] as number) : 0))
        .sort((a, b) => b.data.size - a.data.size); // in all views, always sort by size
      const p = d3.partition<IADSApiVisNode>().size([2 * Math.PI, +root.height + 1])(root); // add x (angle), y (distance) to tree structure
      return p as NetworkHierarchyNode<IADSApiVisNode>;
    },
    [keyToUseAsValue],
  );

  // actaul tree root data for graph
  const graphRoot = useMemo(() => partition(root), [partition, root]);

  // color function returns color based on domain
  const color = useMemo(() => {
    return d3
      .scaleOrdinal<string>()
      .domain(['0', '1', '2', '3', '4', '5', '6'])
      .range([
        'hsla(282, 60%, 52%, 1)',
        'hsla(349, 61%, 47%, 1)',
        'hsla(26, 95%, 67%, 1)',
        'hsla(152, 60%, 40%, 1)',
        'hsla(193, 64%, 61%, 1)',
        'hsla(220, 70%, 56%, 1)',
        'hsla(250, 50%, 47%, 1)',
      ]);
  }, []);

  // arc function returns a pie data for a tree node
  const arc = useMemo(() => {
    return d3
      .arc<NetworkHierarchyNode<IADSApiVisNode>>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5) // padding between segments
      .innerRadius((d) => {
        if (d.depth === 1) {
          return d.y0 * radius + radius / 2;
        }
        return d.y0 * radius;
      })
      .outerRadius((d) => Math.max(d.y1 * radius - 1)); // - 1 for gap
  }, []);

  // function that gives the font size for a tree node based on value
  const occurrencesFontScale = useMemo(() => {
    return d3
      .scaleLog()
      .domain([d3.min(sizes), d3.max(sizes)])
      .range([8, 20]);
  }, [sizes]);

  const citationFontScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([d3.min(citation_counts), d3.max(citation_counts)])
      .range([8, 20]);
  }, [citation_counts]);

  const readFontScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([d3.min(read_counts), d3.max(read_counts)])
      .range([8, 20]);
  }, [read_counts]);

  // function that gives the data for path from node to node
  const line = useMemo(() => {
    return d3
      .lineRadial<NetworkHierarchyNode<IADSApiVisNode>>()
      .curve(d3.curveBundle.beta(0.85))
      .radius(radius * 3 - 1) // one is a gap
      .angle((d) => d.x0 + (d.x1 - d.x0) / 2);
  }, []);

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

  // function to get font size from node data
  const fontSize = (d: NetworkHierarchyNode<IADSApiVisNode>, key: string) => {
    return key === 'size'
      ? `${occurrencesFontScale(d.value)}px`
      : key === 'citation_count'
      ? `${citationFontScale(d.value)}px`
      : `${readFontScale(d.value)}px`;
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

  // links weights
  const weights = useMemo(() => link_data.map((l) => l[2]), [link_data]);

  // function that gives the stroke width of a link
  const linkScale = useMemo(() => {
    return d3
      .scalePow()
      .exponent(8)
      .domain([d3.min(weights), d3.max(weights)])
      .range([0.5, 3.5]);
  }, [weights]);

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

  // function that gives the transform of node label to its proper position
  const labelTransform = useCallback((d: NetworkHierarchyNode<IADSApiVisNode>) => {
    const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
    const y = d.y1 * radius + 2; // just outside the circle
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }, []);

  // returns the alignment for label, relative to the circle
  const textAnchor = useCallback((d: NetworkHierarchyNode<IADSApiVisNode>) => {
    const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
    if (x < 180) {
      return 'start';
    } else {
      return 'end';
    }
  }, []);

  // node linking data
  const getLinks = useCallback((linkData: number[][]) => {
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
  }, []);

  // transition nodes for view change
  const transitionNodePaths = useCallback((root: NetworkHierarchyNode<IADSApiVisNode>) => {
    d3.selectAll('.node-path')
      .data(root.descendants().slice(1))
      .join('path')
      .transition()
      .duration(1500)
      .attrTween('d', function (d) {
        const i = d3.interpolateObject(this._lastAngle, d);
        this._lastAngle = { x0: d.x0, x1: d.x1 }; // cache current angle
        return (t: number) => {
          return arc(i(t));
        };
      });
  }, []);

  // transition node labels for view change
  const transitionNodeLabels = useCallback((root: NetworkHierarchyNode<IADSApiVisNode>, key: IADSApiVisNodeKey) => {
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
  }, []);

  // transition links for view change
  const transitionLinks = useCallback((links: ILink[]) => {
    d3.selectAll('.link-container')
      .selectAll<BaseType, ILink>('.link')
      .data(links)
      .join('path')
      .transition()
      .duration(1500)
      .attr('d', (d) => line(d.source.path(d.target)));
  }, []);

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
        .selectAll('path')
        .data(graphRoot.descendants().slice(1)) // flattened nodes, exclude the root itself
        .join('path')
        .classed('node-path', (d) => d.depth !== 0)
        .attr('fill', nodeFill)
        .attr('fill-opacity', 0.8)
        .attr('pointer-events', 'auto')
        .attr('d', arc) // the shape to draw
        .each(function (d) {
          this._lastAngle = { x0: d.x0, x1: d.x1 };
        }) // save this angle for use in transition interpolation
        .on('click', (e, p) => {
          onClickNode(p.data);
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
          onClickNode(p.data);
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
