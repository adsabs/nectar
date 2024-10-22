import {
  ICitationsTableData,
  IIndicesTableData,
  ILineGraph,
  IMetricsGraphs,
  IPapersTableData,
  IReadsTableData,
} from '@/components/Visualizations/types';
import {
  getCitationTableData,
  getIndicesTableData,
  getPapersTableData,
  getReadsTableData,
  plotCitationsHist,
  plotPapersHist,
  plotReadsHist,
  plotTimeSeriesGraph,
} from '@/components/Visualizations/utils';
import { BasicStatsKey, CitationsStatsKey, IADSApiMetricsResponse, MetricsResponseKey } from '@/api/metrics/types';

export interface IMetricsData {
  citationsGraphs: IMetricsGraphs;
  readsGraphs: IMetricsGraphs;
  papersGraphs: IMetricsGraphs;
  indicesGraph: ILineGraph;
  citationsTable: ICitationsTableData;
  readsTable: IReadsTableData;
  papersTable: IPapersTableData;
  indicesTable: IIndicesTableData;
}

export const useMetrics = (metrics: IADSApiMetricsResponse, isSinglePaper: boolean): IMetricsData => {
  const hasCitations = metrics && metrics[MetricsResponseKey.CS][CitationsStatsKey.TNC] > 0;

  const hasReads = metrics && metrics[MetricsResponseKey.BS][BasicStatsKey.TNR] > 0;

  const hasPapers = isSinglePaper ? false : metrics && metrics[MetricsResponseKey.BS][BasicStatsKey.NP] > 0;

  const hasIndicesTable = isSinglePaper
    ? false
    : metrics && metrics[MetricsResponseKey.I] && metrics[MetricsResponseKey.IR];

  const hasIndicesGraph = isSinglePaper ? false : metrics && metrics[MetricsResponseKey.TS];

  const hist = metrics ? metrics.histograms : null;

  // graph data
  const citationsGraphs = hasCitations
    ? {
        totalGraph: plotCitationsHist(false, hist.citations, isSinglePaper),
        normalizedGraph: plotCitationsHist(true, hist.citations, isSinglePaper),
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

  const indicesGraph = hasIndicesGraph ? plotTimeSeriesGraph(metrics[MetricsResponseKey.TS]) : undefined;

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

  const indicesTable = hasIndicesTable
    ? getIndicesTableData({
        refereed: metrics[MetricsResponseKey.IR],
        total: metrics[MetricsResponseKey.I],
      })
    : null;

  return {
    citationsGraphs,
    readsGraphs,
    papersGraphs,
    indicesGraph,
    citationsTable,
    readsTable,
    papersTable,
    indicesTable,
  };
};
