import { useMemo } from 'react';
import { purifyString } from '@/utils/common/formatters';
import { IExportApiParams, IExportApiResponse, ExportApiJournalFormat } from '@/api/export/types';
import { useGetExportCitation } from '@/api/export/export';
import { SolrSort } from '@/api/models';
import { IDocsEntity } from '@/api/search/types';

export interface UseCitationExporterParams {
  format: string;
  customFormat: string;
  keyformat: string;
  journalformat: ExportApiJournalFormat;
  authorcutoff: number;
  maxauthor: number;
  bibcodes: IDocsEntity['bibcode'][];
  sort?: SolrSort[];
}

export interface UseCitationExporterReturn {
  data: IExportApiResponse | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
}

/**
 * Simple data-fetching hook for citation export.
 * Takes all params directly - no internal state management.
 * State lives in the parent component (page uses nuqs for URL state).
 */
export const useCitationExporter = (params: UseCitationExporterParams): UseCitationExporterReturn => {
  // Build API params from input
  const apiParams: IExportApiParams = useMemo(
    () => ({
      format: params.format,
      customFormat: params.customFormat,
      bibcode: params.bibcodes,
      sort: params.sort,
      authorcutoff: [params.authorcutoff],
      journalformat: [params.journalformat],
      keyformat: [purifyString(params.keyformat)],
      maxauthor: [params.maxauthor],
    }),
    [
      params.format,
      params.customFormat,
      params.bibcodes,
      params.sort,
      params.authorcutoff,
      params.journalformat,
      params.keyformat,
      params.maxauthor,
    ],
  );

  const result = useGetExportCitation(apiParams, {
    enabled: params.bibcodes.length > 0,
    useErrorBoundary: true,
    retry: false,
  });

  return {
    data: result.data,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    error: result.error as Error | null,
  };
};
