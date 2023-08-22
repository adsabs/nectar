import { IADSApiUserDataResponse, useGetUserSettings, userKeys, useUpdateUserSettings } from '@api';
import { DEFAULT_USER_DATA } from '@components';
import { mergeLeft } from 'ramda';
import { useDebouncedCallback } from 'use-debounce';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@chakra-ui/react';
import { useEffect } from 'react';

export const useSettings = () => {
  const toast = useToast({
    position: 'bottom',
    isClosable: true,
    duration: 3000,
    id: 'settings',
  });
  const queryClient = useQueryClient();
  const { data: settings, ...getSettingsState } = useGetUserSettings({
    suspense: true,
    initialData: DEFAULT_USER_DATA,
  });
  const { mutate, ...updateSettingsState } = useUpdateUserSettings({
    onSuccess: (data) => {
      queryClient.setQueryData<IADSApiUserDataResponse>(userKeys.getUserSettings(), data);
    },
  });

  useEffect(() => {
    if (updateSettingsState.isError) {
      toast.isActive('settings')
        ? toast.update('settings', {
            title: 'Something went wrong.',
            status: 'error',
          })
        : toast({
            title: 'Something went wrong.',
            status: 'error',
          });
    }
    if (updateSettingsState.isSuccess) {
      toast.isActive('settings')
        ? toast.update('settings', {
            title: 'Settings Updated.',
            status: 'success',
          })
        : toast({
            title: 'Settings Updated.',
            status: 'success',
          });
    }
  }, [updateSettingsState.isSuccess, updateSettingsState.isError]);

  return {
    updateSettings: useDebouncedCallback(mutate, 100),
    settings: mergeLeft<IADSApiUserDataResponse, IADSApiUserDataResponse>(settings, DEFAULT_USER_DATA),
    updateSettingsState,
    getSettingsState,
  };
};
