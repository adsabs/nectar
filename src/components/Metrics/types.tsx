import { BarDatum } from '@nivo/bar';
import { Serie } from '@nivo/line';

export interface BarGraph<T extends BarDatum> {
  data: T[];
  keys: string[];
  indexBy: string;
}

export interface LineGraph {
  data: Serie[];
}

export interface IMetricsGraphs {
  totalGraph: BarGraph<BarDatum>;
  normalizedGraph: BarGraph<BarDatum>;
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

export interface IReadsTableData {
  totalNumberOfReads: number[];
  averageNumberOfReads: number[];
  medianNumberOfReads: number[];
  totalNumberOfDownloads: number[];
  averageNumberOfDownloads: number[];
  medianNumberOfDownloads: number[];
}

export interface IPapersTableData {
  totalNumberOfPapers: number[];
  totalNormalizedPaperCount: number[];
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
