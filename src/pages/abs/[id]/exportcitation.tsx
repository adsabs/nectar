import { IADSApiSearchResponse } from '@api';
import { isExportApiFormatKey } from '@api/lib/export';
import { Alert, AlertIcon } from '@chakra-ui/alert';
import { Box } from '@chakra-ui/react';
import { CitationExporter } from '@components';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { withDetailsPage } from '@hocs/withDetailsPage';
import { useGetAbstractDoc } from '@hooks/useGetAbstractDoc';
import { composeNextGSSP, normalizeURLParams, setupApiSSR } from '@utils';
import { ExportApiFormatKey, exportCitationKeys } from '@_api/export';
import { searchKeys } from '@_api/search';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { dehydrate, DehydratedState, hydrate, QueryClient } from 'react-query';

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
  return (
    <AbsLayout doc={doc} titleDescription="Export citation for">
      <Head>
        <title>NASA Science Explorer - Export Citation - {doc?.title[0]}</title>
      </Head>
      <Box pt="1">
        {error ? (
          <Alert status="error">
            <AlertIcon />
            {error.message}
          </Alert>
        ) : (
          <CitationExporter initialFormat={format} records={[doc?.bibcode]} singleMode />
        )}
      </Box>
    </AbsLayout>
  );
};

export const getServerSideProps: GetServerSideProps = composeNextGSSP(withDetailsPage, async (ctx, state) => {
  setupApiSSR(ctx);
  const { fetchExportCitation } = await import('@_api/export');
  const axios = (await import('axios')).default;
  const query = normalizeURLParams(ctx.query);

  try {
    const queryClient = new QueryClient();
    hydrate(queryClient, state.props?.dehydratedState as DehydratedState);
    const {
      response: {
        docs: [{ bibcode }],
      },
    } = queryClient.getQueryData<IADSApiSearchResponse>(searchKeys.abstract(query.id));

    const params = {
      bibcode: [bibcode],
      format: isExportApiFormatKey(query.format) ? query.format : ExportApiFormatKey.bibtex,
    };
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
