import { Button, CircularProgress, Grid, Snackbar } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import React, { lazy } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useErrorResetBoundary } from 'react-query';

const AuthorTable = lazy(() => import('./AuthorTable'));

const AuthorModal: React.FC<IAuthorModal> = ({ id }) => {
  const [tableOpen, setTableOpen] = React.useState(false);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const handleTableOpen = () => setTableOpen(true);
  const handleTableClose = () => setTableOpen(false);
  const handleAlertOpen = () => setAlertOpen(true);
  const handleAlertClose = () => setAlertOpen(false);
  const { reset } = useErrorResetBoundary();

  return (
    <>
      <Grid container>
        <Button size="small" onClick={handleTableOpen} variant="outlined">
          See All Authors
        </Button>
        <ErrorBoundary
          onError={() => {
            handleAlertOpen();
            handleTableClose();
          }}
          FallbackComponent={({ resetErrorBoundary, error }) => (
            <Snackbar
              open={alertOpen}
              autoHideDuration={6000}
              onClose={() => {
                handleAlertClose();
                resetErrorBoundary();
              }}
            >
              <Alert
                severity="error"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => {
                      handleAlertClose();
                      resetErrorBoundary();
                      handleTableOpen();
                      reset();
                    }}
                  >
                    Try again
                  </Button>
                }
              >
                Sorry! there was an error ({error?.message})
              </Alert>
            </Snackbar>
          )}
        >
          <React.Suspense
            fallback={<CircularProgress size={20} id="author-aff-progress" />}
          >
            {tableOpen && (
              <AuthorTable
                id={id}
                onClose={handleTableClose}
                open={tableOpen}
              />
            )}
          </React.Suspense>
        </ErrorBoundary>
      </Grid>
    </>
  );
};

interface IAuthorModal {
  id: string;
}

export default AuthorModal;
