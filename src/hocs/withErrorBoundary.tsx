import { FunctionComponent, ReactNode, Suspense } from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

interface IWithErrorBoundaryProps {
  onReset?: () => void;
  onErrorRender: (fallbackProps?: FallbackProps) => ReactNode;
  onLoadingRender: () => ReactNode;
}

export const withErrorBoundary =
  <TProps extends object>(options: IWithErrorBoundaryProps, WrappedComponent: FunctionComponent<TProps>) =>
  // eslint-disable-next-line react/display-name
  (props: TProps) =>
    (
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            onReset={() => {
              options?.onReset?.();
              reset();
            }}
            fallbackRender={options.onErrorRender}
          >
            <Suspense fallback={options.onLoadingRender()}>
              <WrappedComponent {...props} />
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    );
