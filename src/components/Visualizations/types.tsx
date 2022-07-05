import { CitationsStatsKey, BasicStatsKey, TimeSeriesKey } from '@api';
import { BarDatum } from '@nivo/bar';
import { Serie } from '@nivo/line';

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

export interface ISunburstGraph {
  data: SunburstNode;
  idKey?: string;
  valueKey?: string;
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

export type SunburstNode = {
  name: string | number | unknown;
  children?: SunburstNode[];
  value?: number;
};
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
