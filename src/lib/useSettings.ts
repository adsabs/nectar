import { mergeLeft } from 'ramda';
import { useDebouncedCallback } from 'use-debounce';
import { useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useToast } from '@chakra-ui/react';
import { useEffect } from 'react';
import { isNotEmpty } from 'ramda-adjunct';
import { useSession } from '@/lib/useSession';
import { IADSApiUserDataParams, IADSApiUserDataResponse } from '@/api/user/types';
import { useGetUserSettings, userKeys, useUpdateUserSettings } from '@/api/user/user';
import { DEFAULT_USER_DATA } from '@/api/user/models';

export const useSettings = (options?: UseQueryOptions<IADSApiUserDataResponse>) => {
  const { isAuthenticated } = useSession();
  const toast = useToast({
    position: 'bottom',
    isClosable: true,
    duration: 3000,
    id: 'settings',
  });
  const queryClient = useQueryClient();
  const { data: settings, ...getSettingsState } = useGetUserSettings({
    suspense: true,
    retry: false,
    enabled: isAuthenticated,
    placeholderData: DEFAULT_USER_DATA,
    ...options,
  });
  const { mutate, ...updateSettingsState } = useUpdateUserSettings({
    onSuccess: (data) => {
      queryClient.setQueryData<IADSApiUserDataResponse>(userKeys.getUserSettings(), data);
    },
  });

  useEffect(() => {
    if (updateSettingsState.isError) {
      if (toast.isActive('settings')) {
        toast.update('settings', {
          title: 'Something went wrong.',
          status: 'error',
        });
      } else {
        toast({
          title: 'Something went wrong.',
          status: 'error',
        });
      }
    }
    if (updateSettingsState.isSuccess) {
      if (toast.isActive('settings')) {
        toast.update('settings', {
          title: 'Settings Updated.',
          status: 'success',
        });
      } else {
        toast({
          title: 'Settings Updated.',
          status: 'success',
        });
      }
    }
  }, [updateSettingsState.isSuccess, updateSettingsState.isError, toast]);

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
