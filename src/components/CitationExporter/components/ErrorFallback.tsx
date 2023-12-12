import { IExportApiResponse } from '@api';
import { Alert, AlertIcon, Button, Stack } from '@chakra-ui/react';
import { parseAPIError } from '@utils';
import { AxiosError } from 'axios';
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
}) => {
  const message = parseAPIError(error);

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
