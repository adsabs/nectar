import { Box } from '@chakra-ui/react';

import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useSettings } from '@/lib/useSettings';
import { CitationExporter } from '@/components/CitationExporter';
import { JournalFormatMap } from '@/components/Settings';
import { ExportApiFormatKey } from '@/api/export/types';
import { useExportFormats } from '@/lib/useExportFormats';
import { createAbsGetServerSideProps } from '@/lib/serverside/absCanonicalization';
import { feedbackItems } from '@/components/NavBar';
import { AbsRecordBoundary } from '@/components/AbsRecordBoundary';
import { AbsPageProps } from '@/lib/abs/absRecordState';
import { useAbsRecordState } from '@/lib/abs/useAbsRecordState';

const ExportCitationPage: NextPage<AbsPageProps> = ({ ssr, queryId, initialDoc }) => {
  const router = useRouter();

  const { isValidFormat } = useExportFormats();

  const id = router.query.id as string;

  const { state } = useAbsRecordState({ ssr, queryId, initialDoc });

  // get export related user settings
  const { settings } = useSettings({
    suspense: false,
  });

  const format =
    typeof router.query.format === 'string' && isValidFormat(router.query.format)
      ? router.query.format
      : ExportApiFormatKey.bibtex;

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

  const handleMissingRecordFeedback = () => {
    void router.push({
      pathname: feedbackItems.record.path,
    });
  };

  return (
    <AbsRecordBoundary
      state={state}
      recordId={id}
      label="Export Citations"
      titleDescription="Export citation for"
      onFeedback={handleMissingRecordFeedback}
    >
      {(doc) => (
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
      )}
    </AbsRecordBoundary>
  );
};

export default ExportCitationPage;

export const getServerSideProps = createAbsGetServerSideProps((ctx) => {
  const rawFormat = Array.isArray(ctx.params?.format) ? ctx.params?.format.join('/') : (ctx.params?.format as string);
  const safeFormat = rawFormat ? encodeURIComponent(rawFormat) : '';
  return safeFormat ? `exportcitation/${safeFormat}` : 'exportcitation';
});
