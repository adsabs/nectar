import { Alert, AlertDescription, AlertIcon, AlertTitle, Button } from '@chakra-ui/react';
import { parseAPIError } from '@/utils';
import { FallbackProps } from 'react-error-boundary';

// hard-coded error messages from the service
// this is fragile, but a default is provided if a match no longer works
export const errorMessages = {
  noInfo: 'no information received',
  noBibcodeSubmitted: 'no bibcode submitted',
  noBibcode: 'no bibcode found in payload (parameter name is `bibcode`)',
  maxAuthorRange: 'parameter maxauthor should be a positive integer >= 0',
  numYearsRange: 'parameter numyears should be positive integer > 0',
  noResults: 'no result from solr',
  defaultErr: 'Unknown Server Error',
} as const;

const defaultTitle = 'Sorry, we were unable to generate the affiliations form';

const getMessage = (error: string) => {
  switch (error) {
    case errorMessages.noBibcodeSubmitted:
      return "No records we're sent, try going back to the search results and re-generating this form";
    case errorMessages.noResults:
      return "No results we're found for this query, try going back to the search results and re-generating this form";
    default:
      return 'Please try reloading the page to see if the error persists';
  }
};

export const AuthorAffiliationsErrorMessage = (
  props: Partial<FallbackProps> & {
    title?: string;
    error?: unknown;
  },
) => {
  const { title = defaultTitle, resetErrorBoundary } = props;

  const error = typeof props.error === 'string' ? props.error : parseAPIError(props.error);

  return (
    <Alert status="error" maxW="container.sm" flexWrap="wrap" justifyContent="center">
      <AlertIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {getMessage(error)}.
        {resetErrorBoundary ? (
          <Button variant="link" onClick={resetErrorBoundary}>
            Or try again
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
};
