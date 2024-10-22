import { Box } from '@chakra-ui/react';

import { AbsLayout } from '@/components/Layout/AbsLayout';
import { NextPage } from 'next';
import { path } from 'ramda';
import { useRouter } from 'next/router';
import { useSettings } from '@/lib/useSettings';
import { CitationExporter } from '@/components/CitationExporter';
import { JournalFormatMap } from '@/components/Settings';
import { ExportApiFormatKey, isExportApiFormat } from '@/api/export/types';
import { useGetAbstract } from '@/api/search/search';
import { IDocsEntity } from '@/api/search/types';

const ExportCitationPage: NextPage = () => {
  const router = useRouter();
  const format = isExportApiFormat(router.query.format) ? router.query.format : ExportApiFormatKey.bibtex;
  const { data } = useGetAbstract({ id: router.query.id as string });
  const doc = path<IDocsEntity>(['docs', 0], data);

  // get export related user settings
  const { settings } = useSettings({
    suspense: false,
  });

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
    <AbsLayout doc={doc} titleDescription="Export citation for" label="Export Citations">
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

export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
