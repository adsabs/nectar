import {
  getCitationTableData,
  getPapersTableData,
  getReadsTableData,
  plotCitationsHist,
  plotPapersHist,
  plotReadsHist,
} from '@components/Metrics/graphUtils';
import { ICitationsTableData, IMetricsGraphs, IPapersTableData, IReadsTableData } from '@components/Metrics/types';
import { BasicStatsKey, CitationsStatsKey, IADSApiMetricsResponse, MetricsResponseKey } from '@_api/metrics/types';

export interface IMetricsData {
  citationsGraphs: IMetricsGraphs;
  readsGraphs: IMetricsGraphs;
  papersGraphs: IMetricsGraphs;
  citationsTable: ICitationsTableData;
  readsTable: IReadsTableData;
  papersTable: IPapersTableData;
}

export const useMetrics = (metrics: IADSApiMetricsResponse, isSinglePaper: boolean): IMetricsData => {
  const hasCitations = metrics && metrics[MetricsResponseKey.CS][CitationsStatsKey.TNC] > 0;

  const hasReads = metrics && metrics[MetricsResponseKey.BS][BasicStatsKey.TNR] > 0;

  const hasPapers = isSinglePaper ? false : metrics && metrics[MetricsResponseKey.BS][BasicStatsKey.NP] > 0;

  const hist = metrics ? metrics.histograms : null;

  // graph data
  const citationsGraphs = hasCitations
    ? {
        totalGraph: plotCitationsHist(false, hist.citations),
        normalizedGraph: plotCitationsHist(true, hist.citations),
      }
    : null;

  const readsGraphs = hasReads
    ? {
        totalGraph: plotReadsHist(false, hist.reads),
        normalizedGraph: plotReadsHist(true, hist.reads),
      }
    : null;

  const papersGraphs = hasPapers
    ? {
        totalGraph: plotPapersHist(false, hist.publications),
        normalizedGraph: plotPapersHist(true, hist.publications),
      }
    : null;

  // table data
  const citationsTable = hasCitations
    ? getCitationTableData({
        refereed: metrics[MetricsResponseKey.CSR],
        total: metrics[MetricsResponseKey.CS],
      })
    : null;

  const readsTable = hasReads
    ? getReadsTableData({
        refereed: metrics[MetricsResponseKey.BSR],
        total: metrics[MetricsResponseKey.BS],
      })
    : null;

  const papersTable = hasPapers
    ? getPapersTableData({
        refereed: metrics[MetricsResponseKey.BSR],
        total: metrics[MetricsResponseKey.BS],
      })
    : null;

  return {
    citationsGraphs,
    readsGraphs,
    papersGraphs,
    citationsTable,
    readsTable,
    papersTable,
  };
};
