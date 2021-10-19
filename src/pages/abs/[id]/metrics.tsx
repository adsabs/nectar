import AdsApi, { IADSApiMetricsParams, IDocsEntity, IUserData } from '@api';
import { MetricsResponseKey, CitationsStatsKey, BasicStatsKey, IADSApiMetricsResponse } from '@api/lib/metrics/types';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { Metrics } from '@components/Metrics';
import { normalizeURLParams } from '@utils';
import { NextPage, GetServerSideProps } from 'next';
import React from 'react';

interface IMetricsPageProps {
  originalDoc: IDocsEntity;
  error?: string;
  hasGraphics: boolean;
  hasMetrics: boolean;
  metrics: IADSApiMetricsResponse;
}

const MetricsPage: NextPage<IMetricsPageProps> = (props: IMetricsPageProps) => {
  const { originalDoc, error, hasGraphics, hasMetrics, metrics } = props;

  const hasCitations =
    metrics && metrics[MetricsResponseKey.CITATION_STATS][CitationsStatsKey.TOTAL_NUMBER_OF_CITATIONS] > 0;

  const hasReads = metrics && metrics[MetricsResponseKey.BASIC_STATS][BasicStatsKey.TOTAL_NUMBER_OF_READS] > 0;

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
        ) : hasCitations || hasReads ? (
          <Metrics metrics={metrics} isAbstract={true} />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-xl">{'No metrics data'}</div>
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
  const originalDoc = await adsapi.search.getDocument(query.id);
  const hasGraphics =
    !originalDoc.notFound && !originalDoc.error ? await adsapi.graphics.hasGraphics(adsapi, params.bibcode) : false;
  const hasMetrics =
    !originalDoc.notFound && !originalDoc.error ? await adsapi.metrics.hasMetrics(adsapi, params.bibcode) : false;

  return originalDoc.notFound || originalDoc.error
    ? { notFound: true }
    : result.isErr()
    ? {
        props: {
          originalDoc: originalDoc.doc,
          hasGraphics,
          hasMetrics,
          error: 'Unable to get results',
          metrics: null,
        },
      }
    : {
        props: {
          originalDoc: originalDoc.doc,
          hasGraphics,
          hasMetrics,
          metrics: result.value,
        },
      };
};
