import { ReactNode } from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { handleBoundaryError } from '@/lib/errorHandler';
import { PageErrorFallback } from '@/components/PageErrorFallback';
import { Center, Spinner } from '@chakra-ui/react';

interface PageErrorBoundaryProps {
  children: ReactNode;
  pageName?: string;
  fallbackTitle?: string;
  onReset?: () => void;
  fallbackRender?: (props: FallbackProps) => ReactNode;
  hideHomeButton?: boolean;
}

const DefaultLoading = () => (
  <Center minH="400px">
    <Spinner size="xl" color="blue.500" thickness="3px" />
  </Center>
);

export const PageErrorBoundary = ({
  children,
  pageName = 'Page',
  fallbackTitle,
  onReset,
  fallbackRender,
  hideHomeButton,
}: PageErrorBoundaryProps) => {
  const renderFallback =
    fallbackRender ??
    ((props: FallbackProps) => (
      <PageErrorFallback
        error={props.error}
        resetErrorBoundary={props.resetErrorBoundary}
        title={fallbackTitle}
        hideHomeButton={hideHomeButton}
      />
    ));

  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={() => {
            onReset?.();
            reset();
          }}
          onError={(error, errorInfo) => {
            handleBoundaryError(error, errorInfo, {
              component: pageName,
            });
          }}
          fallbackRender={renderFallback}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};

export { DefaultLoading };
