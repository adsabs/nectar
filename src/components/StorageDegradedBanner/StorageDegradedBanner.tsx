import { Alert, AlertDescription, CloseButton } from '@chakra-ui/react';
import { useState } from 'react';

export const StorageDegradedBanner = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <Alert status="warning" variant="subtle" justifyContent="space-between" alignItems="center">
      <AlertDescription>
        Your browser is blocking site storage. Preferences and settings won&apos;t be saved between sessions.
      </AlertDescription>
      <CloseButton aria-label="Close" onClick={() => setDismissed(true)} />
    </Alert>
  );
};
