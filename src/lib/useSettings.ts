import { isNil, mergeLeft } from 'ramda';
import { useDebouncedCallback } from 'use-debounce';
import { useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useToast } from '@chakra-ui/react';
import { isNotEmpty } from 'ramda-adjunct';
import { useSession } from '@/lib/useSession';
import { IADSApiUserDataParams, IADSApiUserDataResponse } from '@/api/user/types';
import { useGetUserSettings, userKeys, useUpdateUserSettings } from '@/api/user/user';
import { DEFAULT_CITATION_FORMAT, DEFAULT_EXPORT_FORMAT, DEFAULT_USER_DATA } from '@/api/user/models';
import { useExportFormats } from './useExportFormats';

export const useSettings = (options?: UseQueryOptions<IADSApiUserDataResponse>, hideToast?: boolean) => {
  const { isAuthenticated } = useSession();
  const toast = useToast({ id: 'settings' });
  const queryClient = useQueryClient();
  const { data: settingsdata, ...getSettingsState } = useGetUserSettings({
    suspense: true,
    retry: false,
    enabled: isAuthenticated,
    placeholderData: DEFAULT_USER_DATA,
    ...options,
  });

  const showToast = isNil(hideToast) || hideToast === false;

  const { mutate, ...updateSettingsState } = useUpdateUserSettings({
    onSuccess: (data) => {
      queryClient.setQueryData<IADSApiUserDataResponse>(userKeys.getUserSettings(), data);
      if (showToast) {
        toast({
          title: 'Settings Updated.',
          status: 'success',
        });
      }
    },
    onError: () => {
      if (showToast) {
        toast({
          title: 'Something went wrong.',
          status: 'error',
        });
      }
    },
  });

  const { isValidFormatLabel, isValidCitationFormatId } = useExportFormats();

  // validate settings data
  const settings = {
    ...settingsdata,
    defaultExportFormat: isValidFormatLabel(settingsdata.defaultExportFormat)
      ? settingsdata.defaultExportFormat
      : DEFAULT_EXPORT_FORMAT,
    defaultCitationFormat: isValidCitationFormatId(settingsdata.defaultCitationFormat)
      ? settingsdata.defaultCitationFormat
      : DEFAULT_CITATION_FORMAT,
  };

  const updateSettings = useDebouncedCallback((params: IADSApiUserDataParams) => {
    if (isNotEmpty(params)) {
      mutate(params);
    }
  }, 100);

  return {
    updateSettings,
    settings: mergeLeft<IADSApiUserDataResponse, IADSApiUserDataResponse>(settings, DEFAULT_USER_DATA),
    updateSettingsState,
    getSettingsState,
  };
};
