import { useD3 } from '../useD3';
import * as d3 from 'd3';
import { ReactElement, useCallback, useEffect, useMemo } from 'react';
import { Selection } from 'd3';
import { IADSApiVisNode, IADSApiVisNodeKey } from '@api';
export interface INetworkGraphProps {
  root: IADSApiVisNode;
  link_data: number[][];
  showLinkLayer: boolean;
  onClickNode: (node: IADSApiVisNode) => void;
  keyToUseAsValue: IADSApiVisNodeKey;
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

  // convert our tree data to hierachy tree data for graph
  const partition = useCallback(
    (data: IADSApiVisNode) => {
      // data to node in tree structure
      const root = d3
        .hierarchy<IADSApiVisNode>(data)
        .sum((d) => (d[keyToUseAsValue] ? (d[keyToUseAsValue] as number) : 0))
        .sort((a, b) => b.data.size - a.data.size); // in all views, always sort by size
      const p = d3.partition().size([2 * Math.PI, +root.height + 1])(root); // add x (angle), y (distance) to tree structure
      return p;
    },
    [root, keyToUseAsValue],
  );

  const graphRoot = useMemo(() => partition(root), [root, keyToUseAsValue]);

  // color function returns color based on domain
  const color = useMemo(() => {
    return d3
      .scaleOrdinal()
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
      .arc()
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
      .lineRadial()
      .curve(d3.curveBundle.beta(0.85))
      .radius(radius * 3 - 1) // one is a gap
      .angle((d) => d.x0 + (d.x1 - d.x0) / 2);
  }, []);

  const weights = useMemo(() => link_data.map((l) => l[2]), [link_data]);

  // function that gives the stroke width of a link
  const linkScale = useMemo(() => {
    return d3
      .scalePow()
      .exponent(8)
      .domain([d3.min(weights), d3.max(weights)])
      .range([0.5, 3.5]);
  }, [weights]);

  const labelTransform = (d) => {
    const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
    const y = d.y1 * radius + 2; // just outside the circle
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  };

  // align label to the circle
  const textAnchor = useCallback((d) => {
    const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
    if (x < 180) {
      return 'start';
    } else {
      return 'end';
    }
  }, []);

  // function that does the transition of arc from one angle to new angle
  const arcTween = useCallback((d) => {
    console.log(d._lastAngle);
    const i = d3.interpolateObject(d._lastAngle, d);
    return (t) => {
      const b = i(t);
      // d._lastAngle =  { x0: b.x0, x1: b.x1 };
      return arc(b);
    };
  }, []);

  //TODO: use css to hide link layer
  const renderFunction = useCallback(
    (svg: Selection<SVGSVGElement, unknown, HTMLElement, any>) => {
      // create a tree structure of data with information for drawing

      svg.selectAll('*').remove();

      svg.attr('viewBox', [0, 0, width, width]).style('font', '10px sans-serif').classed('network-graph-svg', true);

      const g = svg
        .append('g')
        .classed('network-graph-container', true)
        .attr('transform', `translate(${width / 2},${width / 2})`);

      // zoom behavior
      // const zoom = d3
      //   .zoom()
      //   .scaleExtent([0.7, 3])
      //   .on('zoom', function (event) {
      //     g.attr('transform', event.transform);
      //   });
      // svg.call(zoom);
      // // svg.on('dblclick.zoom', null);

      // const nodeContainers = g
      //   .selectAll('g')
      //   .data(graphRoot.descendants().slice(1))
      //   .join('g')
      //   .classed('node-containers', true);

      // Nodes

      const nodes = g
        .append('g')
        .selectAll('path')
        .data(graphRoot.descendants().slice(1)) // flattened nodes, exclude the root itself
        .join('path')
        .classed('node-path', (d) => d.depth !== 0)
        .attr('fill', (d) => {
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
        })
        .attr('fill-opacity', 0.8)
        .attr('pointer-events', 'auto')
        .attr('d', (d) => arc(d)) // the shape to draw
        .each((d) => (d._lastAngle = { x0: d.x0, x1: d.x1 })) // save this angle for use in transition interpolation
        .style('cursor', 'pointer')
        .on('click', (e, p) => {
          onClickNode(p.data);
        });

      // node labels
      const labels = g
        .append('g')
        .selectAll('text')
        .data(graphRoot.descendants().slice(1))
        .join('text')
        .classed('node-label', true)
        .attr('dy', '0.35em')
        .attr('fill-opacity', 1)
        .attr('transform', (d) => labelTransform(d))
        .style('font-size', (d) =>
          keyToUseAsValue === 'size'
            ? `${occurrencesFontScale(d.value)}px`
            : keyToUseAsValue === 'citation_count'
            ? `${citationFontScale(d.value)}px`
            : `${readFontScale(d.value)}px`,
        )
        .text((d) => (d.depth === 2 ? d.data.name : null))
        .attr('text-anchor', (d) => textAnchor(d))
        .style('cursor', 'pointer')
        .on('mouseover', (e, n) => {
          if (!showLinkLayer) {
            return;
          }

          // highlight links
          const highlightedLinks = g
            .selectAll('.link')
            .filter((l) => l.source.data.name === n.data.name || l.target.data.name === n.data.name)
            // .classed('selected-link', true); // use this line instead of the next two
            .style('stroke', '#EE8E29');

          // highlight labels
          const highlightedLabelNames = new Set();
          highlightedLinks.each((hl) => {
            highlightedLabelNames.add(hl.source.data.name);
            highlightedLabelNames.add(hl.target.data.name);
          });

          g.selectAll('.node-label')
            .filter((nl) => highlightedLabelNames.has(nl.data.name))
            // .classed('linked-label', true)
            .style('fill', '#EE8E29');
        })
        .on('mouseout', () => {
          // remove highlights
          // g.selectAll('.link').classed('selected-link', false);
          // g.selectAll('.node-label').classed('linked-label', false);
          g.selectAll('.link').style('stroke', null);
          g.selectAll('.node-label').style('fill', null);
        });

      // Links
      const links = link_data.map((l) => {
        const source = g
          .selectAll('.node-path')
          .filter((d) => d.data.numberName === l[0])
          .data()[0];
        const target = g
          .selectAll('.node-path')
          .filter((d) => d.data.numberName === l[1])
          .data()[0];

        const weight = l[2];
        return { source, target, weight };
      });

      const linkContainer = g.append('g').classed('link-container', true);

      // Overlay on top of circle
      linkContainer
        .append('circle')
        .attr('r', radius * 3) // depths = 3, each level has radius, so 3 * radius
        .style('fill', 'rgba(255, 255, 255, 0.5)');

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
        .attr('stroke-width', (d) => {
          // get link weight
          const weight = links.filter((l) => {
            return (
              (l.source.data.name === d.source.data.name && l.target.data.name === d.target.data.name) ||
              (l.target.data.name === d.source.data.name && l.source.data.name === d.target.data.name)
            );
          })[0].weight;
          return linkScale(weight);
        });

      return svg;
    },
    [root, link_data],
  );

  const { ref } = useD3(renderFunction, [renderFunction]);

  // show link layer toggled, show/hide link layer
  useEffect(() => {
    if (showLinkLayer) {
      // show link layer
      d3.selectAll('.link-container').style('display', 'block');
    } else {
      // hide link layer
      d3.selectAll('.link-container').style('display', 'none');
    }
  }, [showLinkLayer]);

  // When view changes, update graph
  useEffect(() => {
    d3.selectAll('.node-path')
      .data(graphRoot.descendants().slice(1)) // update data, use  name for mapping
      .join('path')
      .transition()
      .duration(1500)
      .attrTween('d', arcTween)
      .each((d) => (d._lastAngle = { x0: d.x0, x1: d.x1 })); // save this angle for use in transition interpolation

    d3.selectAll('.node-label')
      .join('text')
      .data(graphRoot.descendants().slice(1))
      .attr('opacity', '0')
      .style('display', (d) => {
        if (keyToUseAsValue == 'size') {
          return 'block';
        }
        if (keyToUseAsValue == 'citation_count' && d.data.citation_count > citationLimit) {
          return 'block';
        }
        if (keyToUseAsValue == 'read_count' && d.data.read_count > readLimit) {
          return 'block';
        }
        return 'none';
      })
      .style('font-size', (d) =>
        keyToUseAsValue === 'size'
          ? `${occurrencesFontScale(d.value)}px`
          : keyToUseAsValue === 'citation_count'
          ? `${citationFontScale(d.value)}px`
          : `${readFontScale(d.value)}px`,
      )
      .attr('transform', (d) => labelTransform(d))
      .attr('text-anchor', (d) => textAnchor(d))
      .transition()
      .duration(1500)
      .attr('opacity', 1);

    const links = link_data.map((l) => {
      const source = d3
        .selectAll('.node-path')
        .filter((d) => d.data.numberName === l[0])
        .data()[0];
      const target = d3
        .selectAll('.node-path')
        .filter((d) => d.data.numberName === l[1])
        .data()[0];

      const weight = l[2];
      return { source, target, weight };
    });

    d3.selectAll('.link-container')
      .selectAll('.link')
      .data(links)
      .join('path')
      .transition()
      .duration(1500)
      .attr('d', (d) => line(d.source.path(d.target)));
  }, [graphRoot]);

  return <svg ref={ref} />;
};
