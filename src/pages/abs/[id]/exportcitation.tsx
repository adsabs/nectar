import Adsapi, { IDocsEntity } from '@api';
import { ExportApiFormat, isExportApiFormat } from '@api/lib/export';
import { Export } from '@components';
import { abstractPageNavDefaultQueryFields } from '@components/AbstractSideNav/model';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { normalizeURLParams } from '@utils';
import { GetServerSideProps, NextPage } from 'next';
import React from 'react';

interface IExportCitationPageProps {
  bibcode: IDocsEntity['bibcode'];
  text?: string;
  format: ExportApiFormat;
  originalDoc: IDocsEntity;
}

const ExportCitationPage: NextPage<IExportCitationPageProps> = ({ originalDoc, bibcode, text, format }) => {
  return (
    <AbsLayout doc={originalDoc}>
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

const getOriginalDoc = async (api: Adsapi, id: string) => {
  const result = await api.search.query({
    q: `identifier:${id}`,
    fl: [...abstractPageNavDefaultQueryFields, 'title'],
  });
  return result.unwrapOr(null).docs[0];
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

  const originalDoc = await getOriginalDoc(adsapi, query.id);
  console.log(originalDoc);

  if (result.isErr() || originalDoc === null) {
    return {
      props: {
        bibcode: query.id,
        format,
        originalDoc,
      },
    };
  }

  return {
    props: {
      bibcode: query.id,
      format,
      text: result.value,
      originalDoc,
    },
  };
};

export default ExportCitationPage;
