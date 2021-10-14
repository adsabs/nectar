import Adsapi, { IDocsEntity } from '@api';
import { ExportApiFormat, isExportApiFormat } from '@api/lib/export';
import { Export } from '@components';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { getDocument, getHasGraphics, getHasMetrics, normalizeURLParams } from '@utils';
import { GetServerSideProps, NextPage } from 'next';
import React from 'react';

interface IExportCitationPageProps {
  bibcode: IDocsEntity['bibcode'];
  text?: string;
  format: ExportApiFormat;
  originalDoc: IDocsEntity;
  hasGraphics: boolean;
  hasMetrics: boolean;
}

const ExportCitationPage: NextPage<IExportCitationPageProps> = ({
  originalDoc,
  bibcode,
  text,
  format,
  hasMetrics,
  hasGraphics,
}) => {
  return (
    <AbsLayout doc={originalDoc} hasGraphics={hasGraphics} hasMetrics={hasMetrics}>
      <article aria-labelledby="title" className="mx-0 my-10 px-4 w-full bg-white md:mx-2">
        <div className="pb-1">
          <h2 className="prose-xl text-gray-900 font-medium leading-8" id="title">
            <span>Export citation for</span> <div className="text-2xl">{originalDoc.title}</div>
          </h2>
        </div>

        <Export initialBibcodes={[bibcode]} initialText={text} initialFormat={format} singleMode />
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

  const originalDoc = await getDocument(adsapi, query.id);
  const hasGraphics =
    !originalDoc.notFound && !originalDoc.error ? await getHasGraphics(adsapi, originalDoc.doc.bibcode) : false;
  const hasMetrics =
    !originalDoc.notFound && !originalDoc.error ? await getHasMetrics(adsapi, originalDoc.doc.bibcode) : false;

  return originalDoc.notFound || originalDoc.error
    ? { notFound: true }
    : result.isErr()
    ? {
        props: {
          bibcode: query.id,
          format,
          originalDoc: originalDoc.doc,
          hasGraphics,
          hasMetrics,
          error: 'Unable to get results',
        },
      }
    : {
        props: {
          bibcode: query.id,
          format,
          text: result.value,
          originalDoc: originalDoc.doc,
          hasGraphics,
          hasMetrics,
        },
      };
};

export default ExportCitationPage;
