import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useD3 } from './useD3';
import * as d3 from 'd3';
import { BaseType, Selection } from 'd3';
import { useBubblePlot } from './useBubblePlot';
import { IBubblePlot, IBubblePlotNodeData } from '../types';
import { findIndex, propEq, without } from 'ramda';

export type Scale = 'linear' | 'log';

export type BubblePlotConfig = {
  xKey: 'date' | 'citation_count';
  yKey: 'citation_count' | 'read_count';
  rKey: 'citation_count' | 'read_count' | 'year'; // radius
  xScaleTypes: Scale[];
  yScaleTypes: Scale[];
  xLabel: string;
  yLabel: string;
};

export type BubblePlotProps = BubblePlotConfig & {
  graph: IBubblePlot;
  onSelectNodes: (nodes: BubbleNode[]) => void;
};

type BubbleNode = IBubblePlotNodeData & { cx: number; cy: number };

const margin = { top: 80, right: 200, bottom: 80, left: 80 };
const width = 1000 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

export const BubblePlot = ({
  graph,
  xKey,
  yKey,
  rKey,
  xScaleTypes,
  yScaleTypes,
  xLabel,
  yLabel,
  onSelectNodes,
}: BubblePlotProps): ReactElement => {
  const [currentScaleType, setCurrentScaleType] = useState({ x: xScaleTypes[0], y: yScaleTypes[0] });

  useEffect(() => setCurrentScaleType({ x: xScaleTypes[0], y: yScaleTypes[0] }), [xScaleTypes, yScaleTypes]);

  const { groupColor, xScale, yScale, rScale } = useBubblePlot({
    graph,
    xKey,
    yKey,
    rKey,
    xScaleType: currentScaleType.x,
    yScaleType: currentScaleType.y,
    width,
    height,
  });

  const { data, groups = [] } = graph;

  const [selectedGroup, setSelectedGroup] = useState<string>(null);

  const [selectedNodes, setSelectedNodes] = useState<BubbleNode[]>([]);

  const rendered = useRef(false);

  // For time axis, show year if more than 2 years, otherwise show month
  const timeRange = useMemo(() => {
    const dateRange = d3.extent(data, (d) => d.date);
    return dateRange[1].getFullYear() - dateRange[0].getFullYear() > 2 ? 'year' : 'month';
  }, [data]);

  const nodes: BubbleNode[] = useMemo(() => {
    const n_copy: BubbleNode[] = [...data];
    n_copy.forEach((n) => {
      n.cx = currentScaleType.x === 'log' && n[xKey] === 0 ? 0 : xScale(n[xKey]);
      n.cy = currentScaleType.y === 'log' && n[yKey] === 0 ? 0 : yScale(n[yKey]);
    });
    return n_copy;
  }, [data, currentScaleType, xScale, yScale]); // xScale and yXcale are updated when xKey and yKey change

  // When changing graph or axis scale
  useEffect(() => {
    transitionXAxis();
    renderXAxisLabel(d3.select('.x-label'));
    transitionYAxis();
    renderYAxisLabel(d3.select('.y-label'));
  }, [xScale, yScale]);

  useEffect(() => {
    transitionNodes();
  }, [nodes, xScale, yScale, rScale]);

  useEffect(() => {
    transitionToGroup();
  }, [selectedGroup]);

  useEffect(() => {
    d3.selectAll<BaseType, BubbleNode>('.paper-circle').classed(
      'selected',
      (n) => findIndex(propEq('bibcode', n.bibcode), selectedNodes) !== -1,
    );

    onSelectNodes(selectedNodes);
  }, [selectedNodes]);

  const attachListeners = useCallback(() => {
    const papers = d3.selectAll<BaseType | SVGCircleElement, BubbleNode>('.paper-circle');

    // click on node
    papers.on('click', (event, node) => {
      if (findIndex(propEq('bibcode', node.bibcode), selectedNodes) === -1) {
        setSelectedNodes([...selectedNodes, node]);
      } else {
        setSelectedNodes(selectedNodes.filter((n) => n.bibcode !== node.bibcode));
      }
    });

    // grab nodes when rectangle boundary is drawn
    const brush = d3
      .brush()
      .extent([
        [0, 0],
        [width, height],
      ])
      .on('end', (event) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const extent = event.selection;

        if (event.type === 'end' && extent) {
          const brushLayer = d3.select<SVGGElement, unknown>('.brush-layer');
          const brushedNodes: BubbleNode[] = [];

          papers.each((d) => {
            if (isBrushed(extent, d.cx, d.cy)) {
              brushedNodes.push(d);
            } else {
              without([d], brushedNodes);
            }
          });

          brushLayer.call(brush.move, null);
          setSelectedNodes([...brushedNodes, ...selectedNodes]);
        }
      });

    // double click to clear all selection
    d3.select<SVGGElement, unknown>('.brush-layer')
      .call(brush)
      .on('dblclick', () => {
        setSelectedNodes([]);
      });
  }, [selectedNodes, setSelectedNodes]);

  // when selectedNodes is changed, need to update listeners
  useEffect(() => {
    attachListeners();
  }, [attachListeners]);

  useEffect(() => {
    // Just rendered
    if (rendered.current) {
      rendered.current = false;
      attachListeners();
    }
  }, [rendered.current]);

  /********** transitions **********/

  const transitionXAxis = useCallback(() => {
    const xAxis =
      xKey !== 'date'
        ? d3.axisBottom(xScale)
        : timeRange === 'year'
        ? d3
            .axisBottom(xScale)
            .ticks(10)
            .tickFormat((domain) => d3.timeFormat('%Y')(domain as Date))
        : d3
            .axisBottom(xScale)
            .ticks(10)
            .tickFormat((domain) => d3.timeFormat('%b-%Y')(domain as Date));

    d3.select<SVGGElement, unknown>('.x-axis').transition().duration(200).call(xAxis);
  }, [xKey, xScale, timeRange]);

  const transitionYAxis = useCallback(() => {
    const yAxis = d3.axisLeft(yScale);
    d3.select<SVGGElement, unknown>('.y-axis').transition().duration(200).call(yAxis);
  }, [yScale]);

  const transitionNodes = useCallback(() => {
    d3.selectAll<BaseType, BubbleNode>('.paper-circle')
      .data(nodes, (n) => n.bibcode)
      .join('circle')
      .transition()
      .duration(200)
      .attr('r', (d) => `${rScale(d[rKey])}px`)
      .attr('cx', (d) => d.cx)
      .attr('cy', (d) => d.cy)
      .style('display', (d) =>
        (currentScaleType.x === 'log' && d[xKey] === 0) ||
        (currentScaleType.y === 'log' && d[yKey] === 0) ||
        (selectedGroup !== null && selectedGroup !== d.pub) // hide invalid nodes (log(0))
          ? 'none'
          : 'block',
      );
  }, [nodes, rScale, xScale, yScale]);

  const transitionToGroup = useCallback(() => {
    // show nodes only belonging to the selected group
    d3.selectAll<BaseType, BubbleNode>('.paper-circle').style('display', (d) =>
      (currentScaleType.x === 'log' && d[xKey] === 0) ||
      (currentScaleType.y === 'log' && d[yKey] === 0) ||
      (selectedGroup !== null && selectedGroup !== d.pub) // hide invalid nodes (log(0))
        ? 'none'
        : 'block',
    );

    // highlight selected group legend
    d3.select('.legend-group-key')
      .selectAll('.group-legend')
      .classed('selected', (d) => selectedGroup === d);
  }, [currentScaleType, xKey, yKey, selectedGroup]);

  /********** renderings **********/

  // is a dot in the selection
  function isBrushed(brushCoords, cx, cy) {
    const x0 = brushCoords[0][0];
    const x1 = brushCoords[1][0];
    const y0 = brushCoords[0][1];
    const y1 = brushCoords[1][1];
    return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
  }

  const renderAxisScaleOptions = (
    labelGroup: Selection<SVGGElement, unknown, HTMLElement, unknown>,
    scaleTypes: Scale[],
    selectedScaleType: Scale,
  ) => {
    if (scaleTypes.includes('log')) {
      labelGroup
        .append('circle')
        .classed('scale-choice', true)
        .classed('log', true)
        .classed('selected', selectedScaleType === 'log')
        .attr('r', '6px')
        .attr('cx', 200)
        .attr('cy', -10);

      labelGroup.append('text').attr('x', 210).attr('y', -5).text('log').classed('log', true);
    }

    // only need to show this if there are more than 1 scale options
    if (scaleTypes.includes('linear') && scaleTypes.length > 1) {
      labelGroup
        .append('circle')
        .classed('scale-choice', true)
        .classed('linear', true)
        .classed('selected', selectedScaleType === 'linear')
        .attr('r', '6px')
        .attr('cx', 250)
        .attr('cy', -10);

      labelGroup.append('text').attr('x', 260).attr('y', -5).text('linear');
    }
  };

  const renderGroupLegend = (g: Selection<SVGGElement, unknown, HTMLElement, unknown>) => {
    g.selectAll('rect')
      .data(groups)
      .enter()
      .append('rect')
      .attr('width', 13)
      .attr('height', 13)
      .attr('y', function (d, i) {
        return i * 22;
      })
      .attr('fill', function (d) {
        if (d === 'other') {
          return 'hsla(0, 0%, 20%, 1)';
        }
        return groupColor(d);
      });

    g.selectAll('text')
      .data(groups)
      .enter()
      .append('text')
      .classed('group-legend', true)
      .classed('selected', (d) => selectedGroup === d)
      .attr('x', 15)
      .attr('y', (_d, i) => i * 22 + 10)
      .text((d) => d)
      .on('click', function (_e, group) {
        if (this.classList.contains('selected')) {
          setSelectedGroup(null);
        } else {
          setSelectedGroup(group);
        }
      });
  };

  const renderXAxisLabel = useCallback(
    (xLabelElement: Selection<SVGGElement, unknown, HTMLElement, unknown>) => {
      // x axis label
      xLabelElement.selectAll('*').remove();
      xLabelElement.append('text').text(xLabel).classed('axis-title', true);
      xLabelElement.call(renderAxisScaleOptions, xScaleTypes, currentScaleType.x);

      // listeners to scale changes
      // these linsteners should be removed at element.selectAll('*').remove()
      xLabelElement
        .select('.scale-choice.linear')
        .on('click', () => setCurrentScaleType({ y: currentScaleType.y, x: 'linear' }));
      xLabelElement
        .select('.scale-choice.log')
        .on('click', () => setCurrentScaleType({ y: currentScaleType.y, x: 'log' }));
    },
    [renderAxisScaleOptions, xLabel, xScaleTypes, currentScaleType.x],
  );

  const renderYAxisLabel = useCallback(
    (yLabelElement: Selection<SVGGElement, unknown, HTMLElement, unknown>) => {
      // y axis label
      yLabelElement.selectAll('*').remove();
      yLabelElement.append('text').text(yLabel).classed('axis-title', true);
      yLabelElement.call(renderAxisScaleOptions, yScaleTypes, currentScaleType.y);

      // listeners to scale changes
      // these linsteners should be removed at element.selectAll('*').remove()
      yLabelElement
        .select('.scale-choice.linear')
        .on('click', () => setCurrentScaleType({ x: currentScaleType.x, y: 'linear' }));
      yLabelElement
        .select('.scale-choice.log')
        .on('click', () => setCurrentScaleType({ x: currentScaleType.x, y: 'log' }));
    },
    [renderAxisScaleOptions, yLabel, yScaleTypes, currentScaleType.y],
  );

  const renderFunction = useCallback(
    (svg: Selection<SVGSVGElement, unknown, HTMLElement, unknown>) => {
      // remove everything
      svg.selectAll('*').remove();
      d3.selectAll('.bubble-plot-tooltip').remove();

      // attaching axes
      const xAxis =
        xKey !== 'date'
          ? d3.axisBottom(xScale)
          : timeRange === 'year'
          ? d3
              .axisBottom(xScale)
              .ticks(10)
              .tickFormat((domain) => d3.timeFormat('%Y')(domain as Date))
          : d3
              .axisBottom(xScale)
              .ticks(10)
              .tickFormat((domain) => d3.timeFormat('%b-%Y')(domain as Date));

      const yAxis = d3.axisLeft(yScale);

      svg.classed('bubble-plot-svg', true);

      const g = svg
        .attr('viewBox', [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom])
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Render Axis
      g.append('g').attr('class', 'x-axis').attr('transform', `translate(0, ${height})`).call(xAxis);

      g.append('g').attr('class', 'y-axis').call(yAxis);

      // Render axis labels
      const yLabelElement = svg
        .append('g')
        .attr('transform', `translate(${margin.left / 2}, ${height + margin.top / 2}) rotate(-90)`)
        .classed('y-label', true);

      const xLabelElement = svg
        .append('g')
        .attr('transform', `translate(${width / 2},${height + margin.top + margin.bottom / 2})`)
        .classed('x-label', true);

      renderXAxisLabel(xLabelElement);
      renderYAxisLabel(yLabelElement);

      // tooltip, only shown when mouse over node
      const tooltip = d3
        .select('body')
        .append('div')
        .classed('bubble-plot-tooltip', true)
        .style('position', 'absolute')
        .style('display', 'none');

      // brush layer: used for user drawing rectangle boundary
      // const brush = d3
      //   .brush()
      //   .extent([
      //     [0, 0],
      //     [width, height],
      //   ])
      //   .on('end', function (event) {
      //     console.log('1');
      //     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      //     const extent = event.selection;
      //     const papers = d3.selectAll<BaseType | SVGCircleElement, BubbleNode>('.paper-circle');
      //     const brushLayer = d3.select<SVGGElement, unknown>('.brush-layer');

      //     if (event.type === 'end' && extent) {
      //       const brushedNodes: BubbleNode[] = [];
      //       // papers.classed('selected', (d) => isBrushed(extent, d.cx, d.cy));
      //       papers.each((d) => {
      //         if (isBrushed(extent, d.cx, d.cy)) {
      //           brushedNodes.push(d);
      //         } else {
      //           without([d], brushedNodes);
      //         }
      //       });

      //       brushLayer.call(brush.move, null);
      //       setSelectedNodes([...brushedNodes, ...selectedNodes]);
      //     }
      //   });
      g.append('g').classed('brush-layer', true); //.call(brush);

      // Render nodes
      const papers = g
        .append('g')
        .classed('all-papers-svg', true)
        .selectAll<BaseType, BubbleNode>('.paper-circle')
        .data(nodes, (n) => n.bibcode)
        .join('circle')
        .classed('paper-circle', true)
        .attr('r', (d) => `${rScale(d[rKey])}px`)
        .attr('cx', (d) => d.cx)
        .attr('cy', (d) => d.cy)
        .style('fill', (d) => (groups && groups.includes(d.pub) ? groupColor(d.pub) : 'gray'))
        .style('display', (d) =>
          (currentScaleType.x === 'log' && d[xKey] === 0) || (currentScaleType.y === 'log' && d[yKey] === 0) // hide invalid nodes (log(0))
            ? 'none'
            : 'block',
        );

      // tooltip event
      papers.on('mouseover.tooltip', (event, node) => {
        const e = event as MouseEvent;
        if ((e.target as SVGAElement).classList.contains('paper-circle')) {
          //  find top 3 nodes with the same position
          const allData = papers
            .filter(
              (d) =>
                (xKey === 'date' ? d[xKey].getTime() === node[xKey].getTime() : d[xKey] === node[xKey]) &&
                d[yKey] === node[yKey],
            )
            .sort((a, b) => b[rKey] - a[rKey])
            .data()
            .slice(0, 3);

          let html = '';
          allData.forEach((d) => {
            html += `<h5>${d.title}</h5>
          (${d.bibcode})</br>
          Citations: <b>${d.citation_count}</b>,
          Reads: <b>${d.read_count}</b><br/><br/>`;
          });

          tooltip
            .html(html)
            .style('display', 'block')
            .style('left', `${e.pageX + 20}px`)
            .style('top', `${e.pageY - 20}px`);
        }
      });

      papers.on('mouseleave.tooltip', () => {
        tooltip.style('display', 'none');
      });

      // // click on node
      // papers.on('click', (_e, node) => {
      //   if (findIndex(propEq('bibcode', node.bibcode), selectedNodes) === -1) {
      //     setSelectedNodes([...selectedNodes, node]);
      //   } else {
      //     setSelectedNodes(selectedNodes.filter((n) => n.bibcode !== node.bibcode));
      //   }
      // });

      // Render group legend
      const legend = svg
        .append('g')
        .classed('legend-group-key', true)
        .attr('transform', `translate(${width + margin.left + 100}, ${height / 2})`);
      renderGroupLegend(legend);

      rendered.current = true;

      return svg;
    },
    [graph],
  );

  const { ref } = useD3(renderFunction, [renderFunction]);

  return <svg ref={ref} />;
};
