import { IADSApiMetricsResponse } from '@api';
import { MetricsResponseKey, CitationsStatsKey, BasicStatsKey } from '@api/lib/metrics/types';
import {
  plotCitationsHist,
  plotReadsHist,
  getCitationTableData,
  getReadsTableData,
} from '@components/Metrics/graphUtils';
import { ICitationsGraphData, ICitationsTableData, IReadsGraphData, IReadsTableData } from '@components/Metrics/types';

export interface IMetricsData {
  citationsGraph: ICitationsGraphData;
  readsGraph: IReadsGraphData;
  citationsTable: ICitationsTableData;
  readsTable: IReadsTableData;
}

export const useMetrics = (metrics: IADSApiMetricsResponse): IMetricsData => {
  const hasCitations =
    metrics && metrics[MetricsResponseKey.CITATION_STATS][CitationsStatsKey.TOTAL_NUMBER_OF_CITATIONS] > 0;

  const hasReads = metrics && metrics[MetricsResponseKey.BASIC_STATS][BasicStatsKey.TOTAL_NUMBER_OF_READS] > 0;

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
        refereed: metrics[MetricsResponseKey.CITATION_STATS_REFEREED],
        total: metrics[MetricsResponseKey.CITATION_STATS],
      })
    : null;

  const readsTable = hasReads
    ? getReadsTableData({
        refereed: metrics[MetricsResponseKey.BASIC_STATS_REFEREED],
        total: metrics[MetricsResponseKey.BASIC_STATS],
      })
    : null;

  return {
    citationsGraph,
    readsGraph,
    citationsTable,
    readsTable,
  };
};
