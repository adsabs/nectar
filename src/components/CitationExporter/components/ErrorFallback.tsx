import { Alert, AlertIcon, Button, Stack } from '@chakra-ui/react';
import { AxiosError } from 'axios';
import { ReactElement } from 'react';
import { ExportContainer } from './ExportContainer';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { IExportApiResponse } from '@/api/export/types';

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
