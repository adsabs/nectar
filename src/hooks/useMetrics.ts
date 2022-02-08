import {
  getCitationTableData,
  getReadsTableData,
  plotCitationsHist,
  plotReadsHist,
} from '@components/Metrics/graphUtils';
import { ICitationsGraphData, ICitationsTableData, IReadsGraphData, IReadsTableData } from '@components/Metrics/types';
import { BasicStatsKey, CitationsStatsKey, IADSApiMetricsResponse, MetricsResponseKey } from '@_api/metrics/types';

export interface IMetricsData {
  citationsGraph: ICitationsGraphData;
  readsGraph: IReadsGraphData;
  citationsTable: ICitationsTableData;
  readsTable: IReadsTableData;
}

export const useMetrics = (metrics: IADSApiMetricsResponse): IMetricsData => {
  const hasCitations = metrics && metrics[MetricsResponseKey.CS][CitationsStatsKey.TNC] > 0;

  const hasReads = metrics && metrics[MetricsResponseKey.BS][BasicStatsKey.TNR] > 0;

  const hist = metrics ? metrics.histograms : null;

  // graph data
  const citationsGraph = hasCitations
    ? {
        graphData: plotCitationsHist(false, hist.citations),
        normalizedGraphData: plotCitationsHist(true, hist.citations),
      }
    : null;

  const readsGraph = hasReads
    ? {
        graphData: plotReadsHist(false, hist.reads),
        normalizedGraphData: plotReadsHist(true, hist.reads),
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
    citationsGraph,
    readsGraph,
    citationsTable,
    readsTable,
  };
};
