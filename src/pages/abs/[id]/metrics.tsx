import AdsApi, { IADSApiMetricsParams, IADSApiMetricsResponse, IDocsEntity, IUserData } from '@api';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { GetServerSideProps, NextPage } from 'next';
import React from 'react';
import { getDocument, normalizeURLParams } from '@utils';
import { getCitationTableData, getReadsTableData, plotCitationsHist, plotReadsHist } from '@graphUtils';
import { CitationsTable } from '@components/Metrics/Citations/Table';
import { ReadsTable } from '@components/Metrics/Reads/Table';
interface IMetricsPageProps {
  metrics: IADSApiMetricsResponse;
  originalDoc: IDocsEntity;
  error?: Error;
}

const MetricsPage: NextPage<IMetricsPageProps> = (props: IMetricsPageProps) => {
  const { originalDoc, error, metrics } = props;

  const hasCitations = metrics && metrics['citation stats']['total number of citations'] > 0;

  const hasReads = metrics && metrics['basic stats']['total number of reads'] > 0;

  const hist = metrics ? metrics.histograms : null;

  // graph data
  const citations_graph = hasCitations
    ? {
        graphData: plotCitationsHist(false, hist.citations),
        normalizedGraphData: plotCitationsHist(true, hist.citations),
      }
    : null;

  const reads_graph = hasReads
    ? {
        graphData: plotReadsHist(false, hist.reads),
        normalizedGraphData: plotReadsHist(true, hist.reads),
      }
    : null;

  // table data
  const citations_table = hasCitations
    ? getCitationTableData({
        refereed: metrics['citation stats refereed'],
        total: metrics['citation stats'],
      })
    : null;

  const reads_table = hasReads
    ? getReadsTableData({
        refereed: metrics['basic stats refereed'],
        total: metrics['basic stats'],
      })
    : null;

  const headingClass = 'bg-gray-100 text-3xl h-16 p-2 font-light flex items-center my-5';

  return (
    <AbsLayout doc={originalDoc}>
      <article aria-labelledby="title" className="mx-0 my-10 px-4 w-full bg-white md:mx-2">
        <div className="pb-1">
          <h2 className="prose-xl pb-5 text-gray-900 text-2xl font-medium leading-8" id="title">
            <span>Metrics for </span> <div className="text-2xl">{originalDoc.title}</div>
          </h2>
        </div>
        {error ? (
          <div className="flex items-center justify-center w-full h-full text-xl">{error}</div>
        ) : (
          <>
            {hasCitations ? (
              <section>
                <div className={headingClass}>
                  <h3>Citations</h3>
                </div>
                <CitationsTable data={citations_table} isAbstract={true} />
              </section>
            ) : null}
            {hasReads ? (
              <section>
                <div className={headingClass}>
                  <h3>Reads</h3>
                </div>
                <ReadsTable data={reads_table} isAbstract={true} />
              </section>
            ) : null}
          </>
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

  return originalDoc.notFound || originalDoc.error
    ? { notFound: true }
    : result.isErr()
    ? { props: { metrics: [], originalDoc: originalDoc.doc, error: 'Unable to get results' } }
    : {
        props: {
          metrics: result.value,
          originalDoc: originalDoc.doc,
        },
      };
};
