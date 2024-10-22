import { useColorMode } from '@chakra-ui/react';
import * as d3 from 'd3';
import { useCallback, useMemo } from 'react';
import { ILink, NetworkHierarchyNode } from './AuthorNetworkGraph';
import { IADSApiAuthorNetworkNode, IADSApiAuthorNetworkNodeKey } from '@/api/vis/types';

/**
 *
 * @param root
 * @param linksData
 * @param keyToUseAsValue
 * @param radius
 * @param numberOfLabelsToShow
 * @returns  functions used to render network graph elements
 */
export const useAuthorNetworkGraph = (
  root: IADSApiAuthorNetworkNode,
  linksData: number[][],
  keyToUseAsValue: IADSApiAuthorNetworkNodeKey,
  radius: number,
  numberOfLabelsToShow: number,
) => {
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
    (data: IADSApiAuthorNetworkNode) => {
      // data to node in tree structure
      const root = d3
        .hierarchy<IADSApiAuthorNetworkNode>(data)
        .sum((d) => (d[keyToUseAsValue] ? d[keyToUseAsValue] : 0))
        .sort((a, b) => b.data.size - a.data.size); // in all views, always sort by size
      const p = d3.partition<IADSApiAuthorNetworkNode>().size([2 * Math.PI, +root.height + 1])(root); // add x (angle), y (distance) to tree structure
      return p as NetworkHierarchyNode<IADSApiAuthorNetworkNode>;
    },
    [keyToUseAsValue],
  );

  // use the same color scheme (category10) as Nivo graphs so they will match the corresponding line graph
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  const noGroupColor = '#a6a6a6';

  // arc function returns a pie data for a tree node
  const arc = useMemo(() => {
    return d3
      .arc<NetworkHierarchyNode<IADSApiAuthorNetworkNode>>()
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
  }, [radius]);

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

  // function to get font size from node data
  const fontSize = (d: NetworkHierarchyNode<IADSApiAuthorNetworkNode>, key: string) => {
    return key === 'size'
      ? `${occurrencesFontScale(d.value)}px`
      : key === 'citation_count'
      ? `${citationFontScale(d.value)}px`
      : `${readFontScale(d.value)}px`;
  };

  // function that gives the data for path from node to node
  const line = useMemo(() => {
    return d3
      .lineRadial<NetworkHierarchyNode<IADSApiAuthorNetworkNode>>()
      .curve(d3.curveBundle.beta(0.85))
      .radius(radius * 3 - 1) // one is a gap
      .angle((d) => d.x0 + (d.x1 - d.x0) / 2);
  }, []);

  // links weights
  const weights = useMemo(() => linksData.map((l) => l[2]), [linksData]);

  // function that gives the stroke width of a link
  const linkScale = useMemo(() => {
    return d3
      .scalePow()
      .exponent(8)
      .domain([d3.min(weights), d3.max(weights)])
      .range([0.5, 3.5]);
  }, [weights]);

  // function that gives the transform of node label to its proper position
  const labelTransform = useCallback((d: NetworkHierarchyNode<IADSApiAuthorNetworkNode>) => {
    const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
    const y = d.y1 * radius + 2; // just outside the circle
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }, []);

  // returns the alignment for label, relative to the circle
  const textAnchor = useCallback((d: NetworkHierarchyNode<IADSApiAuthorNetworkNode>) => {
    const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
    if (x < 180) {
      return 'start';
    } else {
      return 'end';
    }
  }, []);

  // get color of node
  const nodeFill = (d: NetworkHierarchyNode<IADSApiAuthorNetworkNode>) => {
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
  const labelDisplay = (d: NetworkHierarchyNode<IADSApiAuthorNetworkNode>, key: string) => {
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

  const { colorMode } = useColorMode();

  return {
    partition,
    arc,
    fontSize,
    line,
    labelTransform,
    textAnchor,
    nodeFill,
    labelDisplay,
    strokeWidth,
    textColor: colorMode === 'light' ? '#000000' : '#ffffff',
  };
};
