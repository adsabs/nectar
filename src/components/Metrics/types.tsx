import { BarDatum } from '@nivo/bar';

export interface BarGraph {
  data: BarDatum[];
  keys: string[];
}

export interface IMetricsGraphs {
  totalGraph: BarGraph;
  normalizedGraph: BarGraph;
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
