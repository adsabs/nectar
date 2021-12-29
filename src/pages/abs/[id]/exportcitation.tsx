import Adsapi, { IDocsEntity } from '@api';
import { ExportApiFormat, isExportApiFormat } from '@api/lib/export';
import { Export, metatagsQueryFields } from '@components';
import { abstractPageNavDefaultQueryFields } from '@components/AbstractSideNav/model';
import { fetchHasGraphics, fetchHasMetrics } from '@components/AbstractSideNav/queries';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { normalizeURLParams } from '@utils';
import { GetServerSideProps, NextPage } from 'next';
import { dehydrate, QueryClient } from 'react-query';
import { Alert, AlertIcon } from '@chakra-ui/alert';

interface IExportCitationPageProps {
  bibcode: IDocsEntity['bibcode'];
  text?: string;
  format: ExportApiFormat;
  originalDoc: IDocsEntity;
  error?: string;
}

const ExportCitationPage: NextPage<IExportCitationPageProps> = ({ originalDoc, bibcode, text, format, error }) => {
  return (
    <AbsLayout doc={originalDoc} titleDescription="Export citation for">
      {error ? (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      ) : (
        <Export initialBibcodes={[bibcode]} initialText={text} initialFormat={format} singleMode />
      )}
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
