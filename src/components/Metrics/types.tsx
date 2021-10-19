import { IGraphData } from '@components/Metrics/graphUtils';

export interface ICitationsGraphData {
  graphData: IGraphData[];
  normalizedGraphData: IGraphData[];
}

export interface IReadsGraphData {
  graphData: IGraphData[];
  normalizedGraphData: IGraphData[];
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
