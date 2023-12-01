import { ExportApiFormatKey, IDocsEntity, isExportApiFormat, useGetAbstract } from '@api';
import { Box } from '@chakra-ui/react';
import { CitationExporter, JournalFormatMap } from '@components';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { DEFAULT_USER_DATA } from '@components/Settings/model';
import { withDetailsPage } from '@hocs/withDetailsPage';
import { useStore } from '@store';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { isEmpty, path } from 'ramda';
import { composeNextGSSP } from '@ssr-utils';
import { useRouter } from 'next/router';
import { getDetailsPageTitle } from '@pages/abs/[id]/abstract';

const ExportCitationPage: NextPage = () => {
  const router = useRouter();
  const format = isExportApiFormat(router.query.format) ? router.query.format : ExportApiFormatKey.bibtex;
  const { data } = useGetAbstract({ id: router.query.id as string });
  const doc = path<IDocsEntity>(['docs', 0], data);

  // get export related user settings
  const settings = useStore((state) =>
    state.settings.user && !isEmpty(state.settings.user) ? state.settings.user : DEFAULT_USER_DATA,
  );
  const { keyformat, journalformat, authorcutoff, maxauthor } =
    format === ExportApiFormatKey.bibtexabs
      ? {
          keyformat: settings.bibtexABSKeyFormat,
          journalformat: settings.bibtexJournalFormat,
          authorcutoff: parseInt(settings.bibtexABSAuthorCutoff, 10),
          maxauthor: parseInt(settings.bibtexABSMaxAuthors, 10),
        }
      : {
          keyformat: settings.bibtexKeyFormat,
          journalformat: settings.bibtexJournalFormat,
          authorcutoff: parseInt(settings.bibtexAuthorCutoff, 10),
          maxauthor: parseInt(settings.bibtexMaxAuthors, 10),
        };

  return (
    <AbsLayout doc={doc} titleDescription="Export citation for">
      <Head>
        <title>{getDetailsPageTitle(doc, 'Export')}</title>
      </Head>
      <Box pt="1">
        <CitationExporter
          initialFormat={format}
          keyformat={keyformat}
          journalformat={JournalFormatMap[journalformat]}
          maxauthor={maxauthor}
          authorcutoff={authorcutoff}
          records={doc?.bibcode ? [doc.bibcode] : []}
          singleMode
        />
      </Box>
    </AbsLayout>
  );
};

export default ExportCitationPage;

export const getServerSideProps: GetServerSideProps = composeNextGSSP(withDetailsPage);
