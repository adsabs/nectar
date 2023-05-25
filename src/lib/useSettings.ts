import { IADSApiUserDataResponse, useSetUserData } from '@api';
import { useStore } from '@store';
import { noop, parseAPIError } from '@utils';
import { isNotNilOrEmpty } from 'ramda-adjunct';
import { useEffect } from 'react';

interface IUseSettingsProps {
  params: Partial<IADSApiUserDataResponse>;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const useSettings = (props: IUseSettingsProps) => {
  const { params, onSuccess = noop, onError = noop } = props;
  const settings = useStore((state) => state.settings.user);
  const setSettings = useStore((state) => state.setUserSettings);

  const { data, error, ...result } = useSetUserData(params, {
    cacheTime: 0,
    enabled: isNotNilOrEmpty(params),
  });

  useEffect(() => {
    if (data) {
      setSettings(data);
      onSuccess();
    }
    if (error) {
      onError(parseAPIError(error));
    }
  }, [data, error]);

  return { settings, ...result };
};
