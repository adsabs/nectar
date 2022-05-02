import { Alert, AlertIcon, Button, Stack } from '@chakra-ui/react';
import { IExportApiResponse } from '@_api/export';
import axios, { AxiosError } from 'axios';
import { ReactElement } from 'react';
import { ExportContainer } from './ExportContainer';

/**
 * Error boundary fallback
 */
export const ErrorFallback = ({
  error,
  resetErrorBoundary,
}: {
  error: AxiosError<IExportApiResponse> | Error;
  resetErrorBoundary: () => void;
}): ReactElement => {
  let message = error.message;

  // 400 was probably thrown from inside the service, not a network issue (should have a message)
  if (axios.isAxiosError(error) && error.response.status === 400) {
    message = error.response.data?.error ?? error.message;
  }

  return (
    <ExportContainer
      header={
        <Stack spacing="4">
          <Alert status="error" display="flex">
            <AlertIcon />
            {message}
          </Alert>
          <Button onClick={resetErrorBoundary} maxW={['full', '20']}>
            Reset
          </Button>
        </Stack>
      }
    />
  );
};
