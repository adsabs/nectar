import type { BarDatum } from '@nivo/bar';
import type { Serie } from '@nivo/line';
import { BasicStatsKey, CitationsStatsKey, TimeSeriesKey } from '@/api/metrics/types';

export interface IBubblePlotNodeData {
  bibcode: string;
  pubdate: string;
  title: string;
  read_count: number;
  citation_count: number;
  date: Date;
  year: number;
  pub: string;
}
export interface IBubblePlot {
  data: IBubblePlotNodeData[];
  groups?: string[];
}

export interface IBarGraph<T extends BarDatum> {
  data: T[];
  keys: string[];
  indexBy: string;
}

export interface ILineGraph {
  data: Serie[];
  hindex?: number;
  error?: Error;
}

export interface IMetricsGraphs {
  totalGraph: IBarGraph<BarDatum>;
  normalizedGraph: IBarGraph<BarDatum>;
}

export interface YearDatum extends BarDatum {
  year: number;
  refereed: number;
  notrefereed: number;
}

export interface ICitationTableInput {
  refereed: {
    [key in CitationsStatsKey]: number;
  };
  total: {
    [key in CitationsStatsKey]: number;
  } & { 'self-citations': string[] };
}

export interface ICitationsTableData {
  numberOfCitingPapers: number[];
  totalCitations: number[];
  numberOfSelfCitations: number[];
  averageCitations: number[];
  medianCitations: number[];
  normalizedCitations: number[];
  refereedCitations: number[];
  averageRefereedCitations: number[];
  medianRefereedCitations: number[];
  normalizedRefereedCitations: number[];
}

export interface IReadTableInput {
  refereed: {
    [key in BasicStatsKey]: number;
  };
  total: {
    [key in BasicStatsKey]: number;
  };
}

export interface IReadsTableData {
  totalNumberOfReads: number[];
  averageNumberOfReads: number[];
  medianNumberOfReads: number[];
  totalNumberOfDownloads: number[];
  averageNumberOfDownloads: number[];
  medianNumberOfDownloads: number[];
}

export interface IPaperTableInput {
  refereed: {
    [key in BasicStatsKey]: number;
  };
  total: {
    [key in BasicStatsKey]: number;
  };
}

export interface IPapersTableData {
  totalNumberOfPapers: number[];
  totalNormalizedPaperCount: number[];
}

export interface IIndicesTableInput {
  refereed: {
    [key in TimeSeriesKey]?: number;
  };
  total: {
    [key in TimeSeriesKey]?: number;
  };
}
export interface IIndicesTableData {
  hIndex?: number[];
  mIndex?: number[];
  gIndex?: number[];
  i10Index?: number[];
  i100Index?: number[];
  toriIndex?: number[];
  riqIndex?: number[];
  read10Index?: number[];
}

export type FacetField = 'year' | 'citation_count' | 'read_count';

export type Y_Axis = 'linear' | 'log';

// linear for sequenced data like years, so that ordering is maintained even if data is not specified in order
export type X_Axis = 'linear' | 'point';

export type NetworkType = 'author' | 'paper';

export type ISliderRangeRange = [number, number, string];

export interface ISliderRange {
  [i: number]: ISliderRangeRange; // last element for label on slider UI
}

export type Margin = {
  top: number;
  bottom: number;
  right: number;
  left: number;
};

export type HistogramDatum = {
  x: number;
  y: number;
};
