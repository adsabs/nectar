import Adsapi, { IDocsEntity } from '@api';
import { ExportApiFormat, isExportApiFormat } from '@api/lib/export';
import { metatagsQueryFields } from '@components';
import { abstractPageNavDefaultQueryFields } from '@components/AbstractSideNav/model';
import { fetchHasGraphics, fetchHasMetrics } from '@components/AbstractSideNav/queries';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { normalizeURLParams } from '@utils';
import { GetServerSideProps, NextPage } from 'next';
import { dehydrate, QueryClient } from 'react-query';
interface IExportCitationPageProps {
  bibcode: IDocsEntity['bibcode'];
  text?: string;
  format: ExportApiFormat;
  originalDoc: IDocsEntity;
  error?: string;
}

const ExportCitationPage: NextPage<IExportCitationPageProps> = ({ originalDoc, bibcode, text, format, error }) => {
  return (
    <AbsLayout doc={originalDoc}>
      <article aria-labelledby="title" className="mx-0 my-10 px-4 w-full bg-white md:mx-2">
        <div className="pb-1">
          <h2 className="prose-xl text-gray-900 font-medium leading-8" id="title">
            <span>Export citation for</span> <div className="text-2xl">{originalDoc.title}</div>
          </h2>
        </div>
        {error ? (
          <div className="flex items-center justify-center w-full h-full text-xl">{error}</div>
        ) : null
        // <Export initialBibcodes={[bibcode]} initialText={text} initialFormat={format} singleMode />
        }
      </article>
    </AbsLayout>
  );
};

export const getServerSideProps: GetServerSideProps<IExportCitationPageProps> = async (ctx) => {
  const query = normalizeURLParams(ctx.query);
  const { access_token: token } = ctx.req.session.userData;
  const format = isExportApiFormat(query.format) ? query.format : 'bibtex';
  const adsapi = new Adsapi({ token });
  const result = await adsapi.export.getExportText({
    bibcode: [query.id],
    format,
  });

  const originalDoc = await adsapi.search.getDocument(query.id, [
    ...abstractPageNavDefaultQueryFields,
    ...metatagsQueryFields,
  ]);

  const queryClient = new QueryClient();
  if (!originalDoc.notFound && !originalDoc.error) {
    const { bibcode } = originalDoc.doc;
    void (await queryClient.prefetchQuery(['hasGraphics', bibcode], () => fetchHasGraphics(adsapi, bibcode)));
    void (await queryClient.prefetchQuery(['hasMetrics', bibcode], () => fetchHasMetrics(adsapi, bibcode)));
  }

  return originalDoc.notFound || originalDoc.error
    ? { notFound: true }
    : result.isErr()
    ? {
        props: {
          bibcode: query.id,
          format,
          originalDoc: originalDoc.doc,
          error: 'Unable to get results',
          dehydratedState: dehydrate(queryClient),
        },
      }
    : {
        props: {
          bibcode: query.id,
          format,
          text: result.value,
          originalDoc: originalDoc.doc,
          dehydratedState: dehydrate(queryClient),
        },
      };
};

export default ExportCitationPage;
