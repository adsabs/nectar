import { useGetSiteWideMsg } from '@/api/vault/vault';
import { useSession } from '@/lib/useSession';
import { useSettings } from '@/lib/useSettings';
import { Alert, AlertDescription, CloseButton, Flex } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

const LAST_DISMISSED_SYS_MSG = 'last-sys-msg';

export const SiteAlert = () => {
  const { data: systemMsg } = useGetSiteWideMsg({});

  const { isAuthenticated } = useSession();

  const {
    settings,
    updateSettings,
    getSettingsState: { isFetching },
  } = useSettings({}, true);

  const [lastDismissedMsg, setLastDismissedMsg] = useState<string>('');

  const [initialized, setInitialized] = useState(false);

  const handleDismissMessage = () => {
    setLastDismissedMsg(systemMsg);

    if (isAuthenticated) {
      updateSettings({ last_seen_message: systemMsg });
    } else {
      localStorage.setItem(LAST_DISMISSED_SYS_MSG, systemMsg);
    }
  };

  // initialize saved last dismissed msg
  useEffect(() => {
    if (!initialized) {
      if (isAuthenticated) {
        if (!isFetching) {
          setLastDismissedMsg(settings.last_seen_message);
          setInitialized(true);
        }
      } else if (typeof window !== 'undefined' && window.localStorage) {
        setLastDismissedMsg(localStorage.getItem(LAST_DISMISSED_SYS_MSG) ?? '');
        setInitialized(true);
      }
    }
  }, [isAuthenticated, isFetching]);

  // data not yet initialized, alert should stay hidden
  if (!initialized) {
    return null;
  }

  return (
    <>
      {systemMsg && systemMsg.length > 0 && systemMsg !== lastDismissedMsg ? (
        <Alert status="info" variant="subtle" flexDirection="row" justifyContent="space-between" alignItems="start">
          <Flex direction="row">
            <AlertDescription dangerouslySetInnerHTML={{ __html: systemMsg }} />
          </Flex>
          <CloseButton onClick={handleDismissMessage} />
        </Alert>
      ) : null}
    </>
  );
};
