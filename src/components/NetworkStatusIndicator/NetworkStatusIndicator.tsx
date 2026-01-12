import { useEffect, useState } from 'react';
import { Alert, AlertIcon, AlertDescription, CloseButton, Slide } from '@chakra-ui/react';
import { useNetworkStatus } from '@/lib/useNetworkStatus';

export const NetworkStatusIndicator = () => {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      setDismissed(false);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  useEffect(() => {
    if (!isOnline) {
      setDismissed(false);
    }
  }, [isOnline]);

  const handleDismiss = () => {
    setDismissed(true);
    setShowReconnected(false);
  };

  if (dismissed && isOnline) {
    return null;
  }

  return (
    <>
      <Slide direction="top" in={!isOnline} style={{ zIndex: 1400 }}>
        <Alert status="error" variant="solid" justifyContent="center">
          <AlertIcon />
          <AlertDescription>You are offline. Some features may not be available.</AlertDescription>
        </Alert>
      </Slide>

      <Slide direction="top" in={showReconnected && isOnline} style={{ zIndex: 1400 }}>
        <Alert status="success" variant="solid" justifyContent="center">
          <AlertIcon />
          <AlertDescription>You are back online.</AlertDescription>
          <CloseButton position="absolute" right="8px" top="8px" onClick={handleDismiss} aria-label="Dismiss" />
        </Alert>
      </Slide>
    </>
  );
};
