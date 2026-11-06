import { useCallback, useMemo } from 'react';

import { useGetExportFormats } from '@/api/export/export';
import { IADSApiUserDataResponse } from '@/api/user/types';
import { DEFAULT_EXPORT_FORMATS } from '@/components/CitationExporter/models';
import { useStore } from '@/store';

import { ResolvedCitationFormat, resolveCitationFormat } from './citationFormat';
import { useSession } from './useSession';
import { useSettings } from './useSettings';

export interface UseCitationFormatResult {
  format: ResolvedCitationFormat;
  isReady: boolean;
  resolveWithSettings: (settings: IADSApiUserDataResponse) => ResolvedCitationFormat;
}

export const useCitationFormat = (): UseCitationFormatResult => {
  const { isAuthenticated } = useSession();
  const { settings, getSettingsState } = useSettings();
  const appMode = useStore((state) => state.mode);
  const { data: formats } = useGetExportFormats({
    retry: false,
    placeholderData: DEFAULT_EXPORT_FORMATS,
    initialData: DEFAULT_EXPORT_FORMATS,
  });

  const isReady = !isAuthenticated || !getSettingsState.isPlaceholderData;

  const format = useMemo(
    () =>
      resolveCitationFormat({
        isAuthenticated,
        defaultExportFormatLabel: settings.defaultExportFormat,
        customFormats: settings.customFormats,
        appMode,
        formats,
      }),
    [isAuthenticated, settings.defaultExportFormat, settings.customFormats, appMode, formats],
  );

  const resolveWithSettings = useCallback(
    (freshSettings: IADSApiUserDataResponse) =>
      resolveCitationFormat({
        isAuthenticated: true,
        defaultExportFormatLabel: freshSettings.defaultExportFormat,
        customFormats: freshSettings.customFormats,
        appMode,
        formats,
      }),
    [appMode, formats],
  );

  return { format, isReady, resolveWithSettings };
};
