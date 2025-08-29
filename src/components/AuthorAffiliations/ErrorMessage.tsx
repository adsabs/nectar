import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, Center } from '@chakra-ui/react';
import { FallbackProps } from 'react-error-boundary';
import { parseAPIError } from '@/utils/common/parseAPIError';

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
      return "No records we're sent, try going back to the search results and re-generating this form.";
    case errorMessages.noResults:
      return 'No results were found for this query, Try expanding the year range or the number of authors.';
    default:
      return 'Please try reloading the page to see if the error persists.';
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
    <Center m="6">
      <Alert status="error" maxW="container.sm" flexWrap="wrap" justifyContent="center" borderRadius="md">
        <AlertIcon />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>
          <Box my="2">{getMessage(error)}</Box>
          {resetErrorBoundary ? (
            <Button variant="link" onClick={resetErrorBoundary}>
              Or try again
            </Button>
          ) : null}
        </AlertDescription>
      </Alert>
    </Center>
  );
};
