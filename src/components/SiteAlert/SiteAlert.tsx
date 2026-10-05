import { useGetSiteWideMsg } from '@/api/vault/vault';
import { useSession } from '@/lib/useSession';
import { useSettings } from '@/lib/useSettings';
import { hashSiteMsg, writePrefsCookie } from '@/utils/common/prefs-cookie';
import { Alert, AlertDescription, CloseButton, Flex } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

const LAST_DISMISSED_SYS_MSG = 'last-sys-msg';

interface SiteAlertProps {
  initialMessage?: string | null;
  initialDismissedHash?: string;
}

export const SiteAlert = ({ initialMessage, initialDismissedHash }: SiteAlertProps = {}) => {
  // undefined only on the Pages Router path, where dismissal state isn't
  // known yet and the `initialized` gate below still applies.
  const isServerResolved = initialMessage !== undefined;

  const { data: systemMsg } = useGetSiteWideMsg(isServerResolved ? { initialData: initialMessage ?? undefined } : {});

  const message = isServerResolved ? initialMessage ?? '' : systemMsg;

  const { isAuthenticated } = useSession();

  const {
    settings,
    updateSettings,
    getSettingsState: { isFetching },
  } = useSettings({}, true);

  const [lastDismissedMsg, setLastDismissedMsg] = useState<string>('');
  const [dismissedHash, setDismissedHash] = useState<string>(initialDismissedHash ?? '');
  const [initialized, setInitialized] = useState(isServerResolved);

  const handleDismissMessage = () => {
    if (isServerResolved) {
      const hash = hashSiteMsg(message);
      setDismissedHash(hash);
      writePrefsCookie({ dismissedMsg: hash });
    } else {
      setLastDismissedMsg(message);
      if (!isAuthenticated) {
        localStorage.setItem(LAST_DISMISSED_SYS_MSG, message);
      }
    }

    if (isAuthenticated) {
      updateSettings({ last_seen_message: message });
    }
  };

  useEffect(() => {
    if (isServerResolved || initialized) {
      return;
    }
    if (isAuthenticated) {
      if (!isFetching) {
        setLastDismissedMsg(settings.last_seen_message);
        setInitialized(true);
      }
    } else if (typeof window !== 'undefined' && window.localStorage) {
      setLastDismissedMsg(localStorage.getItem(LAST_DISMISSED_SYS_MSG) ?? '');
      setInitialized(true);
    }
  }, [isServerResolved, initialized, isAuthenticated, isFetching, settings.last_seen_message]);

  useEffect(() => {
    if (!isServerResolved || !isAuthenticated || isFetching || !message) {
      return;
    }
    if (settings.last_seen_message === message) {
      const hash = hashSiteMsg(message);
      setDismissedHash(hash);
      writePrefsCookie({ dismissedMsg: hash });
    }
  }, [isServerResolved, isAuthenticated, isFetching, message, settings.last_seen_message]);

  if (!isServerResolved && !initialized) {
    return null;
  }

  const shouldShow = isServerResolved
    ? Boolean(message) && message.length > 0 && hashSiteMsg(message) !== dismissedHash
    : Boolean(message) && message.length > 0 && message !== lastDismissedMsg;

  return (
    <>
      {shouldShow ? (
        <Alert status="info" variant="subtle" flexDirection="row" justifyContent="space-between" alignItems="start">
          <Flex direction="row">
            <AlertDescription dangerouslySetInnerHTML={{ __html: message }} />
          </Flex>
          <CloseButton onClick={handleDismissMessage} />
        </Alert>
      ) : null}
    </>
  );
};
