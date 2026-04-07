import { Alert, AlertDescription, AlertIcon, Button, HStack } from '@chakra-ui/react';

interface DraftBannerProps {
  show: boolean;
  onRestore: () => void;
  onDismiss: () => void;
}

export function DraftBanner({ show, onRestore, onDismiss }: DraftBannerProps) {
  if (!show) {
    return null;
  }

  return (
    <Alert status="info" borderRadius="md" mb={4}>
      <AlertIcon />
      <AlertDescription flex={1}>You have an unsaved draft for this form.</AlertDescription>
      <HStack spacing={2}>
        <Button size="sm" colorScheme="blue" onClick={onRestore}>
          Restore
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          Dismiss
        </Button>
      </HStack>
    </Alert>
  );
}
