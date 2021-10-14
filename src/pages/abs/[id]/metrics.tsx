import AdsApi, { IADSApiMetricsParams, IDocsEntity, IUserData } from '@api';
import { MetricsResponseKey, CitationsStatsKey, BasicStatsKey } from '@api/lib/metrics/types';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { Metrics } from '@components/Metrics';
import {
  plotCitationsHist,
  plotReadsHist,
  getCitationTableData,
  getReadsTableData,
} from '@components/Metrics/graphUtils';
import { ICitationsGraphData, IReadsGraphData, ICitationsTableData, IReadsTableData } from '@components/Metrics/types';
import { normalizeURLParams, getDocument, getHasGraphics, getHasMetrics } from '@utils';
import { NextPage, GetServerSideProps } from 'next';
import React from 'react';

interface IMetricsPageProps {
  originalDoc: IDocsEntity;
  error?: string;
  hasGraphics: boolean;
  hasMetrics: boolean;
  citationsGraph: ICitationsGraphData;
  readsGraph: IReadsGraphData;
  citationsTable: ICitationsTableData;
  readsTable: IReadsTableData;
}

const MetricsPage: NextPage<IMetricsPageProps> = (props: IMetricsPageProps) => {
  const { originalDoc, error, hasGraphics, hasMetrics, citationsGraph, readsGraph, citationsTable, readsTable } = props;

  return (
    <AbsLayout doc={originalDoc} hasGraphics={hasGraphics} hasMetrics={hasMetrics}>
      <article aria-labelledby="title" className="mx-0 my-10 px-4 w-full bg-white md:mx-2">
        <div className="pb-1">
          <h2 className="prose-xl pb-5 text-gray-900 text-2xl font-medium leading-8" id="title">
            <span>Metrics for </span> <div className="text-2xl">{originalDoc.title}</div>
          </h2>
        </div>
        {error ? (
          <div className="flex items-center justify-center w-full h-full text-xl">{error}</div>
        ) : (
          <Metrics
            citationsGraph={citationsGraph}
            readsGraph={readsGraph}
            citationsTable={citationsTable}
            readsTable={readsTable}
            isAbstract={true}
          />
        )}
      </article>
    </AbsLayout>
  );
};

export default MetricsPage;

export const getServerSideProps: GetServerSideProps<IMetricsPageProps> = async (ctx) => {
  const query = normalizeURLParams(ctx.query);
  const request = ctx.req as typeof ctx.req & {
    session: { userData: IUserData };
  };
  const userData = request.session.userData;
  const params: IADSApiMetricsParams = {
    bibcode: query.id,
  };
  const adsapi = new AdsApi({ token: userData.access_token });
  const result = await adsapi.metrics.query(params);
  const originalDoc = await getDocument(adsapi, query.id);
  const hasGraphics =
    !originalDoc.notFound && !originalDoc.error ? await getHasGraphics(adsapi, params.bibcode) : false;
  const hasMetrics = !originalDoc.notFound && !originalDoc.error ? await getHasMetrics(adsapi, params.bibcode) : false;

  if (originalDoc.notFound || originalDoc.error) {
    return { notFound: true };
  } else if (result.isErr()) {
    return {
      props: {
        originalDoc: originalDoc.doc,
        hasGraphics,
        hasMetrics,
        citationsGraph: null,
        readsGraph: null,
        citationsTable: null,
        readsTable: null,
        error: 'Unable to get results',
      },
    };
  }

  const metrics = result.value;

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
    props: {
      originalDoc: originalDoc.doc,
      hasGraphics,
      hasMetrics,
      citationsGraph,
      readsGraph,
      citationsTable,
      readsTable,
    },
  };
};
