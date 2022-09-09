import { ReactElement, useCallback } from 'react';
import { useD3 } from './useD3';
import d3Cloud from 'd3-cloud';
import { Selection } from 'd3';

const width = 1000;

const height = 600;

export interface WordDatum {
  text: string;
  size: number;
}

export interface IWordCloudProps {
  wordData: WordDatum[];
}

export const WordCloud = ({ wordData }: IWordCloudProps): ReactElement => {
  const renderFunction = useCallback(
    (svg: Selection<SVGSVGElement, unknown, HTMLElement, unknown>) => {
      svg.selectAll('*').remove();

      svg
        .attr('viewBox', [0, 0, width, height])
        .attr('width', width)
        .attr('font-family', 'sans-serif')
        .attr('text-anchor', 'middle')
        .attr('style', 'max-width: 100%; height: auto; height: intrinsic;');

      const g = svg.append('g').attr('transform', `translate(${0},${0})`);

      const cloud = d3Cloud()
        .size([width, height])
        .words(wordData)
        .spiral('archimedean')
        .padding(0)
        .rotate(0)
        .font('sans-serif')
        .fontSize((d) => Math.sqrt(d.size) * 15)
        .on('word', ({ size, x, y, rotate, text }) => {
          g.append('text')
            .attr('font-size', size)
            .attr('transform', `translate(${x},${y}) rotate(${rotate})`)
            .text(text);
        });

      cloud.start();

      return svg;
    },
    [wordData],
  );

  const { ref } = useD3(renderFunction, [renderFunction]);

  return <svg ref={ref} />;
};
