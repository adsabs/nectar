import AdsApi, { IADSApiMetricsParams, IADSApiMetricsResponse, IDocsEntity, IUserData } from '@api';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { GetServerSideProps, NextPage } from 'next';
import React from 'react';
import DefaultErrorPage from 'next/error';
import { normalizeURLParams } from '@utils';
import { abstractPageNavDefaultQueryFields } from '@components/AbstractSideNav/model';
import { plotCitationsHist, plotReadsHist } from '@graphUtils';
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

  console.log(metrics);
  const hist = metrics.histograms;
  const citations = {
    graphData: plotCitationsHist(false, hist.citations),
    normalizedGraphData: plotCitationsHist(true, hist.citations),
  };
  console.log(citations);
  const reads = {
    graphData: plotReadsHist(false, hist.reads),
    normalizedGraphData: plotReadsHist(true, hist.reads),
  };
  console.log(reads);

  return (
    <AbsLayout doc={doc}>
      <article aria-labelledby="title" className="mx-0 my-10 px-4 w-full bg-white md:mx-2">
        <div className="pb-1">
          <h2 className="prose-xl pb-5 text-gray-900 text-2xl font-medium leading-8" id="title">
            <span>Metrics for </span> <div className="text-2xl">{doc.title}</div>
          </h2>
        </div>
        <section>
          <div></div>
        </section>
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
