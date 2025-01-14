import { ReactElement, Reducer, useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { useD3 } from './useD3';
import * as d3 from 'd3';
import { BaseType, D3BrushEvent, Selection } from 'd3';
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

interface IBubbleNode extends IBubblePlotNodeData {
  cx: number;
  cy: number;
}

export type BubblePlotProps = BubblePlotConfig & {
  graph: IBubblePlot;
  onSelectNodes: (nodes: IBubbleNode[]) => void;
};

const margin = { top: 80, right: 200, bottom: 80, left: 80 };
const width = 1000 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

interface IBubblePlotState {
  xScaleType: Scale;
  yScaleType: Scale;
  selectedGroup: string;
  selectedNodes: IBubbleNode[];
}

type BubblePlotActions =
  | { type: 'SET_X_SCALE_TYPE'; payload: Scale }
  | { type: 'SET_Y_SCALE_TYPE'; payload: Scale }
  | { type: 'SELECT_GROUP'; payload: string }
  | { type: 'SELECT_NODES'; payload: IBubbleNode[] }
  | { type: 'DESELECT_NODE'; payload: IBubbleNode }
  | { type: 'CLEAR_NODES' };

const reducer: Reducer<IBubblePlotState, BubblePlotActions> = (state, action) => {
  switch (action.type) {
    case 'SET_X_SCALE_TYPE':
      return { ...state, xScaleType: action.payload };
    case 'SET_Y_SCALE_TYPE':
      return { ...state, yScaleType: action.payload };
    case 'SELECT_GROUP':
      return { ...state, selectedGroup: action.payload };
    case 'SELECT_NODES':
      return { ...state, selectedNodes: [...state.selectedNodes, ...action.payload] };
    case 'DESELECT_NODE':
      return { ...state, selectedNodes: state.selectedNodes.filter((n) => n.bibcode !== action.payload.bibcode) };
    case 'CLEAR_NODES':
      return { ...state, selectedNodes: [] };
    default:
      return state;
  }
};

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
  const [state, dispatch] = useReducer(reducer, {
    xScaleType: 'linear',
    yScaleType: 'linear',
    selectedGroup: null,
    selectedNodes: [],
  });

  useEffect(() => dispatch({ type: 'SET_X_SCALE_TYPE', payload: xScaleTypes[0] }), [xScaleTypes]);
  useEffect(() => dispatch({ type: 'SET_Y_SCALE_TYPE', payload: yScaleTypes[0] }), [yScaleTypes]);

  const { groupColor, xScaleFn, yScaleFn, rScaleFn, textColor } = useBubblePlot({
    graph,
    xKey,
    yKey,
    rKey,
    xScaleType: state.xScaleType,
    yScaleType: state.yScaleType,
    width,
    height,
  });

  const { data, groups = [] } = graph;

  // use this to indicate a render has completed
  // so we can append listeners afterward
  const rendered = useRef(false);

  // For time axis, show year if more than 2 years, otherwise show month
  const timeRange = useMemo(() => {
    const dateRange = d3.extent(data, (d) => d.date);
    return dateRange[1].getFullYear() - dateRange[0].getFullYear() > 2 ? 'year' : 'month';
  }, [data]);

  // append node coordinates, so the value can be resued
  const nodes: IBubbleNode[] = useMemo(
    () =>
      data.map(
        (n) =>
          ({
            ...n,
            cx: state.xScaleType === 'log' && n[xKey] === 0 ? 0 : xScaleFn(n[xKey]),
            cy: state.yScaleType === 'log' && n[yKey] === 0 ? 0 : yScaleFn(n[yKey]),
          } as IBubbleNode),
      ),
    [xScaleFn, yScaleFn],
  ); // xScaleFn and yXcaleFn are updated when keys or scale types change

  // When changing graph or axis scale, update axis
  useEffect(() => {
    transitionXAxis();
    renderXAxisLabel(d3.select('.x-label'));
    transitionYAxis();
    renderYAxisLabel(d3.select('.y-label'));
  }, [xScaleFn, yScaleFn]);

  // move the nodes
  useEffect(() => {
    transitionNodes();
  }, [nodes, xScaleFn, yScaleFn, rScaleFn]);

  // group selected or deselected
  useEffect(() => {
    transitionToGroup();
  }, [state.selectedGroup]);

  // selection of nodes change
  useEffect(() => {
    d3.selectAll<BaseType, IBubbleNode>('.paper-circle').classed(
      'selected',
      (n) => findIndex(propEq('bibcode', n.bibcode), state.selectedNodes) !== -1,
    );

    onSelectNodes(state.selectedNodes);
  }, [state.selectedNodes]);

  // attach or modify listeners on the graph
  const attachListeners = useCallback(() => {
    const papers = d3.selectAll<BaseType | SVGCircleElement, IBubbleNode>('.paper-circle');
    const { selectedNodes } = state;

    // click on node
    papers.on('click', (event, node) => {
      if (findIndex(propEq('bibcode', node.bibcode), selectedNodes) === -1) {
        dispatch({ type: 'SELECT_NODES', payload: [node] });
      } else {
        dispatch({ type: 'DESELECT_NODE', payload: node });
      }
    });

    papers.on('keypress', (event: KeyboardEvent, node) => {
      if (event.key === 'Enter') {
        if (findIndex(propEq('bibcode', node.bibcode), selectedNodes) === -1) {
          dispatch({ type: 'SELECT_NODES', payload: [node] });
        } else {
          dispatch({ type: 'DESELECT_NODE', payload: node });
        }
      }
    });

    // select nodes when rectangle boundary is drawn
    const brush = d3
      .brush()
      .extent([
        [0, 0],
        [width, height],
      ])
      .on('end', (event) => {
        const e = event as D3BrushEvent<IBubbleNode>;
        const extent = e.selection;

        if (e.type === 'end' && extent) {
          const brushLayer = d3.select<SVGGElement, unknown>('.brush-layer');
          const brushedNodes: IBubbleNode[] = [];

          papers.each((d) => {
            // if showing single group, only select the nodes in the selected group
            if (
              (state.selectedGroup === null || state.selectedGroup === d.pub) &&
              isBrushed(extent as [[number, number], [number, number]], d.cx, d.cy)
            ) {
              brushedNodes.push(d);
            } else {
              without([d], brushedNodes);
            }
          });

          // remove the boundary on graph
          brush.clear(brushLayer);

          dispatch({ type: 'SELECT_NODES', payload: brushedNodes });
        }
      });

    // double click to clear all selection
    d3.select<SVGGElement, unknown>('.brush-layer')
      .call(brush)
      .on('dblclick', () => {
        dispatch({ type: 'CLEAR_NODES' });
      });
  }, [state.selectedNodes, state.selectedGroup]);

  // when selectedNodes is changed, need to update listeners
  useEffect(() => {
    attachListeners();
  }, [attachListeners]);

  // when svg just rendered, attach listeners
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
        ? d3.axisBottom(xScaleFn)
        : timeRange === 'year'
        ? d3
            .axisBottom(xScaleFn)
            .ticks(10)
            .tickFormat((domain) => d3.timeFormat('%Y')(domain as Date))
        : d3
            .axisBottom(xScaleFn)
            .ticks(10)
            .tickFormat((domain) => d3.timeFormat('%b-%Y')(domain as Date));

    d3.select<SVGGElement, unknown>('.x-axis').transition().duration(200).call(xAxis);
  }, [xKey, xScaleFn, timeRange]);

  const transitionYAxis = useCallback(() => {
    const yAxis = d3.axisLeft(yScaleFn);
    d3.select<SVGGElement, unknown>('.y-axis').transition().duration(200).call(yAxis);
  }, [yScaleFn]);

  const transitionNodes = useCallback(() => {
    d3.selectAll<BaseType, IBubbleNode>('.paper-circle')
      .data(nodes, (n) => n.bibcode)
      .join('circle')
      .transition()
      .duration(200)
      .attr('r', (d) => `${rScaleFn(d[rKey])}px`)
      .attr('cx', (d) => d.cx)
      .attr('cy', (d) => d.cy)
      .style('display', (d) =>
        (state.xScaleType === 'log' && d[xKey] === 0) ||
        (state.yScaleType === 'log' && d[yKey] === 0) ||
        (state.selectedGroup !== null && state.selectedGroup !== d.pub) // hide invalid nodes (log(0))
          ? 'none'
          : 'block',
      );
  }, [nodes, rScaleFn, xScaleFn, yScaleFn]);

  const transitionToGroup = useCallback(() => {
    // show nodes only belonging to the selected group
    d3.selectAll<BaseType, IBubbleNode>('.paper-circle').style('display', (d) =>
      (state.xScaleType === 'log' && d[xKey] === 0) ||
      (state.yScaleType === 'log' && d[yKey] === 0) ||
      (state.selectedGroup !== null && state.selectedGroup !== d.pub) // hide invalid nodes (log(0))
        ? 'none'
        : 'block',
    );

    // highlight selected group legend
    d3.select('.legend-group-key')
      .selectAll('.group-legend')
      .classed('selected', (d) => state.selectedGroup === d);
  }, [state.xScaleType, state.yScaleType, xKey, yKey, state.selectedGroup]);

  /********** renderings **********/

  // is a coordinate in the selection boundary
  function isBrushed(brushCoords: [[number, number], [number, number]], cx: number, cy: number) {
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
          return 'hsla(100, 50%, 20%, 0.9)';
        }
        return groupColor(d);
      });

    g.selectAll('text')
      .data(groups)
      .enter()
      .append('text')
      .classed('group-legend', true)
      .classed('selected', (d) => state.selectedGroup === d)
      .attr('x', 15)
      .attr('y', (_d, i) => i * 22 + 10)
      .text((d) => d)
      .attr('tabindex', 0)
      .on('click', function (_e, group) {
        if (this.classList.contains('selected')) {
          dispatch({ type: 'SELECT_GROUP', payload: null });
        } else {
          dispatch({ type: 'SELECT_GROUP', payload: group });
        }
      })
      .on('keypress', function (e: KeyboardEvent, group) {
        if (e.key === 'Enter') {
          if (this.classList.contains('selected')) {
            dispatch({ type: 'SELECT_GROUP', payload: null });
          } else {
            dispatch({ type: 'SELECT_GROUP', payload: group });
          }
        }
      });
  };

  const renderXAxisLabel = useCallback(
    (xLabelElement: Selection<SVGGElement, unknown, HTMLElement, unknown>) => {
      // x axis label
      xLabelElement.selectAll('*').remove();
      xLabelElement.append('text').text(xLabel).classed('axis-title', true);
      xLabelElement.call(renderAxisScaleOptions, xScaleTypes, state.xScaleType);

      // listeners to scale changes
      // these linsteners should be removed at element.selectAll('*').remove()
      xLabelElement
        .select('.scale-choice.linear')
        .attr('tabindex', 0)
        .on('click', () => dispatch({ type: 'SET_X_SCALE_TYPE', payload: 'linear' }))
        .on('keypress', (event: KeyboardEvent) => {
          if (event.key === 'Enter') {
            dispatch({ type: 'SET_X_SCALE_TYPE', payload: 'linear' });
          }
        });
      xLabelElement
        .select('.scale-choice.log')
        .attr('tabindex', 0)
        .on('click', () => dispatch({ type: 'SET_X_SCALE_TYPE', payload: 'log' }))
        .on('keypress', (event: KeyboardEvent) => {
          if (event.key === 'Enter') {
            dispatch({ type: 'SET_X_SCALE_TYPE', payload: 'log' });
          }
        });
    },
    [renderAxisScaleOptions, xLabel, xScaleTypes, state.xScaleType],
  );

  const renderYAxisLabel = useCallback(
    (yLabelElement: Selection<SVGGElement, unknown, HTMLElement, unknown>) => {
      // y axis label
      yLabelElement.selectAll('*').remove();
      yLabelElement.append('text').text(yLabel).classed('axis-title', true);
      yLabelElement.call(renderAxisScaleOptions, yScaleTypes, state.yScaleType);

      // listeners to scale changes
      // these linsteners should be removed at element.selectAll('*').remove()
      yLabelElement
        .select('.scale-choice.linear')
        .attr('tabindex', 0)
        .on('click', () => dispatch({ type: 'SET_Y_SCALE_TYPE', payload: 'linear' }))
        .on('keypress', (event: KeyboardEvent) => {
          if (event.key === 'Enter') {
            dispatch({ type: 'SET_Y_SCALE_TYPE', payload: 'linear' });
          }
        });
      yLabelElement
        .select('.scale-choice.log')
        .attr('tabindex', 0)
        .on('click', () => dispatch({ type: 'SET_Y_SCALE_TYPE', payload: 'log' }))
        .on('keypress', (event: KeyboardEvent) => {
          if (event.key === 'Enter') {
            dispatch({ type: 'SET_Y_SCALE_TYPE', payload: 'log' });
          }
        });
    },
    [renderAxisScaleOptions, yLabel, yScaleTypes, state.yScaleType],
  );

  const renderFunction = useCallback(
    (svg: Selection<SVGSVGElement, unknown, HTMLElement, unknown>) => {
      // remove everything
      svg.selectAll('*').remove();
      d3.selectAll('.bubble-plot-tooltip').remove();

      // attaching axes
      const xAxis =
        xKey !== 'date'
          ? d3.axisBottom(xScaleFn)
          : timeRange === 'year'
          ? d3
              .axisBottom(xScaleFn)
              .ticks(10)
              .tickFormat((domain) => d3.timeFormat('%Y')(domain as Date))
          : d3
              .axisBottom(xScaleFn)
              .ticks(10)
              .tickFormat((domain) => d3.timeFormat('%b-%Y')(domain as Date));

      const yAxis = d3.axisLeft(yScaleFn);

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
        .classed('y-label', true)
        .style('fill', textColor);

      const xLabelElement = svg
        .append('g')
        .attr('transform', `translate(${width / 2},${height + margin.top + margin.bottom / 2})`)
        .classed('x-label', true)
        .style('fill', textColor);

      renderXAxisLabel(xLabelElement);
      renderYAxisLabel(yLabelElement);

      // tooltip, only shown when mouse over node
      const tooltip = d3
        .select('body')
        .append('div')
        .classed('bubble-plot-tooltip', true)
        .style('position', 'absolute')
        .style('display', 'none');

      g.append('g').classed('brush-layer', true); //.call(brush);

      // Render nodes
      const papers = g
        .append('g')
        .classed('all-papers-svg', true)
        .selectAll<BaseType, IBubbleNode>('.paper-circle')
        .data(nodes, (n) => n.bibcode)
        .join('circle')
        .classed('paper-circle', true)
        .attr('r', (d) => `${rScaleFn(d[rKey])}px`)
        .attr('cx', (d) => d.cx)
        .attr('cy', (d) => d.cy)
        .style('fill', (d) => (groups && groups.includes(d.pub) ? groupColor(d.pub) : 'gray'))
        .style('display', (d) =>
          (state.xScaleType === 'log' && d[xKey] === 0) || (state.yScaleType === 'log' && d[yKey] === 0) // hide invalid nodes (log(0))
            ? 'none'
            : 'block',
        )
        .attr('tabindex', 0);

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

      // Render group legend
      const legend = svg
        .append('g')
        .classed('legend-group-key', true)
        .attr('transform', `translate(${width + margin.left + 100}, ${height / 2})`);
      renderGroupLegend(legend);

      rendered.current = true;

      return svg;
    },
    [graph, textColor],
  );

  const { ref } = useD3(renderFunction, [renderFunction]);

  return <svg ref={ref} />;
};
