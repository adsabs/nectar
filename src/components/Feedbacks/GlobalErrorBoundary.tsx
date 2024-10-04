import { Center } from '@chakra-ui/react';
import { ErrorBoundary } from '@sentry/nextjs';
import { ReactElement, ReactNode } from 'react';
import { SuspendedAlert } from './SuspendedAlert';

export const GlobalErrorBoundary = ({ children }: { children: ReactNode | ReactElement }) => {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <Center>
          <SuspendedAlert
            label="Sorry, we've encountered an application error"
            error={error}
            resetErrorBoundary={resetError}
          />
        </Center>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};
