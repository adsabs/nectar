import AdsApi, { IADSApiMetricsParams, IADSApiMetricsResponse, IDocsEntity, IUserData } from '@api';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { GetServerSideProps, NextPage } from 'next';
import React from 'react';
import DefaultErrorPage from 'next/error';
import { normalizeURLParams } from '@utils';
import { abstractPageNavDefaultQueryFields } from '@components/AbstractSideNav/model';
import { getCitationTableData, getReadsTableData, plotCitationsHist, plotReadsHist } from '@graphUtils';
import { CitationsTable } from '@components/Metrics/Citations/Table';
import { ReadsTable } from '@components/Metrics/Reads/Table';
interface IMetricsPageProps {
  metrics: IADSApiMetricsResponse;
  doc: IDocsEntity;
  error?: Error;
}

const MetricsPage: NextPage<IMetricsPageProps> = (props: IMetricsPageProps) => {
  const { doc, error, metrics } = props;

  if (error) {
    return <DefaultErrorPage statusCode={404} title={error.message} />;
  }

  const hasCitations = metrics['citation stats']['total number of citations'] > 0;

  const hasReads = metrics['basic stats']['total number of reads'] > 0;

  const hist = metrics.histograms;

  // graph data
  const citations_graph = {
    graphData: plotCitationsHist(false, hist.citations),
    normalizedGraphData: plotCitationsHist(true, hist.citations),
  };

  const reads_graph = {
    graphData: plotReadsHist(false, hist.reads),
    normalizedGraphData: plotReadsHist(true, hist.reads),
  };

  // table data
  const citations_table = getCitationTableData({
    refereed: metrics['citation stats refereed'],
    total: metrics['citation stats'],
  });

  const reads_table = getReadsTableData({
    refereed: metrics['basic stats refereed'],
    total: metrics['basic stats'],
  });

  const headingClass = 'bg-gray-100 text-3xl h-16 p-2 font-light flex items-center my-5';

  return (
    <AbsLayout doc={doc}>
      <article aria-labelledby="title" className="mx-0 my-10 px-4 w-full bg-white md:mx-2">
        <div className="pb-1">
          <h2 className="prose-xl pb-5 text-gray-900 text-2xl font-medium leading-8" id="title">
            <span>Metrics for </span> <div className="text-2xl">{doc.title}</div>
          </h2>
        </div>
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
      </article>
    </AbsLayout>
  );
};

export default MetricsPage;

const getOriginalDoc = async (api: AdsApi, id: string) => {
  const result = await api.search.query({
    q: `identifier:${id}`,
    fl: [...abstractPageNavDefaultQueryFields, 'title'],
  });
  return result.isOk() ? result.value.docs[0] : null;
};

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
  const originalDoc = await getOriginalDoc(adsapi, query.id);

  return !originalDoc
    ? { props: { error: 'Document not found' } }
    : result.isErr()
    ? { props: { metrics: {}, originalDoc, error: result.error } }
    : {
        props: {
          metrics: result.value,
          doc: originalDoc,
        },
      };
};
