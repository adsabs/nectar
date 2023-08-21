import { ExportApiFormatKey, exportCitationKeys, IADSApiSearchResponse, isExportApiFormat, searchKeys } from '@api';
import { Alert, AlertIcon, Box } from '@chakra-ui/react';
import { CitationExporter, JournalFormatMap } from '@components';
import { getExportCitationDefaultContext } from '@components/CitationExporter/CitationExporter.machine';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { DEFAULT_USER_DATA } from '@components/Settings/model';
import { withDetailsPage } from '@hocs/withDetailsPage';
import { useGetAbstractDoc } from '@lib/useGetAbstractDoc';
import { useIsClient } from '@lib/useIsClient';
import { normalizeURLParams, unwrapStringValue } from '@utils';
import { useStore } from '@store';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { isEmpty } from 'ramda';
import { dehydrate, DehydratedState, hydrate, QueryClient } from '@tanstack/react-query';
import { composeNextGSSP } from '@ssr-utils';

interface IExportCitationPageProps {
  id: string;
  format: ExportApiFormatKey;
  error?: {
    status?: string;
    message?: string;
  };
}
const ExportCitationPage: NextPage<IExportCitationPageProps> = ({ id, format, error }) => {
  const doc = useGetAbstractDoc(id);
  const isClient = useIsClient();
  const title = unwrapStringValue(doc?.title);
  // get export related user settings
  const settings = useStore((state) =>
    state.settings.user && !isEmpty(state.settings.user) ? state.settings.user : DEFAULT_USER_DATA,
  );
  const { keyformat, journalformat, authorcutoff, maxauthor } =
    format === ExportApiFormatKey.bibtexabs
      ? {
          keyformat: settings.bibtexABSKeyFormat,
          journalformat: settings.bibtexJournalFormat,
          authorcutoff: parseInt(settings.bibtexABSAuthorCutoff),
          maxauthor: parseInt(settings.bibtexABSMaxAuthors),
        }
      : {
          keyformat: settings.bibtexKeyFormat,
          journalformat: settings.bibtexJournalFormat,
          authorcutoff: parseInt(settings.bibtexAuthorCutoff),
          maxauthor: parseInt(settings.bibtexMaxAuthors),
        };

  return (
    <AbsLayout doc={doc} titleDescription="Export citation for">
      <Head>
        <title>NASA Science Explorer - Export Citation - {title}</title>
      </Head>
      <Box pt="1">
        {error ? (
          <Alert status="error">
            <AlertIcon />
            {error.message}
          </Alert>
        ) : isClient ? (
          <CitationExporter
            initialFormat={format}
            keyformat={keyformat}
            journalformat={JournalFormatMap[journalformat]}
            maxauthor={maxauthor}
            authorcutoff={authorcutoff}
            records={doc?.bibcode ? [doc.bibcode] : []}
            singleMode
          />
        ) : (
          <CitationExporter.Static
            records={doc?.bibcode ? [doc.bibcode] : []}
            initialFormat={format}
            totalRecords={1}
          />
        )}
      </Box>
    </AbsLayout>
  );
};

export const getServerSideProps: GetServerSideProps = composeNextGSSP(withDetailsPage, async (ctx, state) => {
  const { fetchExportCitation } = await import('@api');
  const axios = (await import('axios')).default;
  const query = normalizeURLParams<{ id: string; format: string }>(ctx.query);

  try {
    const queryClient = new QueryClient();
    hydrate(queryClient, state.props?.dehydratedState as DehydratedState);
    const {
      response: {
        docs: [{ bibcode }],
      },
    } = queryClient.getQueryData<IADSApiSearchResponse>(searchKeys.abstract(query.id));

    const { params } = getExportCitationDefaultContext({
      format: isExportApiFormat(query.format) ? query.format : ExportApiFormatKey.bibtex,
      records: [bibcode],
      singleMode: true,
    });

    void (await queryClient.prefetchQuery({
      queryKey: exportCitationKeys.primary(params),
      queryFn: fetchExportCitation,
      meta: { params },
    }));

    return {
      props: {
        format: params.format,
        dehydratedState: dehydrate(queryClient),
      },
    };
  } catch (e) {
    if (axios.isAxiosError(e) && e.response) {
      return {
        props: {
          error: {
            status: e.response.status,
            message: e.message,
          },
        },
      };
    }
    return {
      props: {
        error: {
          status: 500,
          message: 'Unknown server error',
        },
      },
    };
  }
});

export default ExportCitationPage;
