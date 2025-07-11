import { useGetExportFormats } from '@/api/export/export';
import { ExportFormatsApiResponse } from '@/api/export/types';
import { DEFAULT_EXPORT_FORMATS } from '@/components/CitationExporter';
import { SelectOption } from '@/components/Select';
import { UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

export type ExportFormatOption = SelectOption<string> & { type: string; ext: string; route: string };

export const useExportFormats = (options?: UseQueryOptions<ExportFormatsApiResponse>) => {
  const { data } = useGetExportFormats({
    retry: false,
    placeholderData: DEFAULT_EXPORT_FORMATS,
    ...options,
  });

  const formatOptions: ExportFormatOption[] = useMemo(() => {
    return data.map((f) => ({
      id: f.route.substring(1),
      label: f.name,
      type: f.type,
      value: f.route.substring(1),
      route: f.route,
      ext:
        f.type === 'HTML'
          ? 'rtf'
          : f.type === 'XML'
          ? 'xml'
          : f.name === '/endnote'
          ? 'enw'
          : f.route === '/bibtexabs'
          ? 'bib'
          : 'txt',
    }));
  }, [data]);

  const getFormatById = useCallback(
    (id: string) => {
      return data.find((f) => f.route.substring(1) === id);
    },
    [data],
  );

  const getFormatOptionById = useCallback(
    (id: string) => {
      return formatOptions.find((o) => o.id === id);
    },
    [formatOptions],
  );

  const getFormatOptionByLabel = useCallback(
    (label: string) => {
      return formatOptions.find((o) => o.label === label);
    },
    [formatOptions],
  );

  const isValidFormat = useCallback(
    (id: string) => {
      return formatOptions.findIndex((o) => o.id === id) > -1;
    },
    [formatOptions],
  );

  return { format: data, getFormatById, formatOptions, getFormatOptionById, isValidFormat, getFormatOptionByLabel };
};
