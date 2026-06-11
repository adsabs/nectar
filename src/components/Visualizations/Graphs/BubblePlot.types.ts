import { IBubblePlot, IBubblePlotNodeData } from '../types';

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

export interface IBubbleNode extends IBubblePlotNodeData {
  cx: number;
  cy: number;
}

export type BubblePlotProps = BubblePlotConfig & {
  graph: IBubblePlot;
  onSelectNodes: (nodes: IBubbleNode[]) => void;
};
