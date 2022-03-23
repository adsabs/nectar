import {
  getCitationTableData,
  getReadsTableData,
  plotCitationsHist,
  plotReadsHist,
} from '@components/Metrics/graphUtils';
import { ICitationsTableData, IMetricsGraphs, IReadsTableData } from '@components/Metrics/types';
import { BasicStatsKey, CitationsStatsKey, IADSApiMetricsResponse, MetricsResponseKey } from '@_api/metrics/types';

export interface IMetricsData {
  citationsGraphs: IMetricsGraphs;
  readsGraphs: IMetricsGraphs;
  citationsTable: ICitationsTableData;
  readsTable: IReadsTableData;
}

export const useMetrics = (metrics: IADSApiMetricsResponse): IMetricsData => {
  const hasCitations = metrics && metrics[MetricsResponseKey.CS][CitationsStatsKey.TNC] > 0;

  const hasReads = metrics && metrics[MetricsResponseKey.BS][BasicStatsKey.TNR] > 0;

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

  return {
    citationsGraphs,
    readsGraphs,
    citationsTable,
    readsTable,
  };
};
