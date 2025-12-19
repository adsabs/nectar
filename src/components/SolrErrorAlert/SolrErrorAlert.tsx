import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Code,
  Collapse,
  HStack,
  Tooltip,
  useClipboard,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon, CopyIcon } from '@chakra-ui/icons';
import { AxiosError } from 'axios';
import { IADSApiSearchResponse } from '@/api/search/types';
import { ParsedSolrError, SOLR_ERROR, useSolrError } from '@/lib/useSolrError';

interface ISolrErrorAlertProps {
  error: AxiosError<IADSApiSearchResponse> | Error;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const SearchErrorAlert = ({ error, onRetry, isRetrying = false }: ISolrErrorAlertProps) => {
  const data = useSolrError(error);
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
  const detailsId = 'search-error-details';
  const { onCopy, hasCopied } = useClipboard(
    typeof data?.originalMsg === 'string' ? data.originalMsg : String(data?.originalMsg ?? ''),
  );
  const { title, message } = solrErrorToCopy(data, { includeFieldName: !!data.field });

  return (
    <Box w="full">
      <Alert status="error" variant="subtle" alignItems="flex-start" borderRadius="md">
        <VStack align="stretch" spacing={2} w="full">
          <HStack align="start" w="full">
            <AlertIcon />
            <VStack align="start" spacing={1} flex="1">
              <AlertTitle>{title}</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </VStack>

            <HStack>
              {onRetry && (
                <Button onClick={onRetry} colorScheme="blue" size="sm" isLoading={isRetrying}>
                  Try Again
                </Button>
              )}
              <Tooltip label={hasCopied ? 'Copied!' : 'Copy full error'}>
                <Button onClick={onCopy} leftIcon={<CopyIcon />} variant="ghost" size="sm">
                  {hasCopied ? 'Copied' : 'Copy'}
                </Button>
              </Tooltip>

              <Button
                rightIcon={isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
                aria-label="toggle error details"
                aria-controls={detailsId}
                onClick={onToggle}
                variant="ghost"
                size="sm"
              >
                {isOpen ? 'Hide' : 'Show'} Details
              </Button>
            </HStack>
          </HStack>

          <Collapse in={isOpen} animateOpacity>
            <Code id={detailsId} p="2" display="block" whiteSpace="pre-wrap" w="full">
              {data?.originalMsg}
            </Code>
          </Collapse>
        </VStack>
      </Alert>
    </Box>
  );
};

type Copy = { title: string; message: string };
type CopyOptions = { includeFieldName?: boolean };

export const solrErrorToCopy = (e: ParsedSolrError, opts: CopyOptions = {}): Copy => {
  const includeField = opts.includeFieldName && 'field' in e && e.field;

  // Buckets for consistent, non-repetitive copy
  const isSyntax =
    e.error === SOLR_ERROR.BAD_QUERY_SYNTAX ||
    e.error === SOLR_ERROR.BAD_RANGE_SYNTAX ||
    e.error === SOLR_ERROR.LOCAL_PARAMS_SYNTAX ||
    e.error === SOLR_ERROR.UNKNOWN_QUERY_PARSER ||
    e.error === SOLR_ERROR.UNDEFINED_FUNCTION;

  const isSorting =
    e.error === SOLR_ERROR.SORT_FIELD_NOT_FOUND ||
    e.error === SOLR_ERROR.CANNOT_SORT_MULTIVALUED ||
    e.error === SOLR_ERROR.DOCVALUES_REQUIRED_FOR_SORT;

  const isInvalidValue =
    e.error === SOLR_ERROR.INVALID_DATE ||
    e.error === SOLR_ERROR.INVALID_NUMBER ||
    e.error === SOLR_ERROR.INVALID_BOOLEAN;

  if (e.error === SOLR_ERROR.FIELD_NOT_FOUND) {
    return {
      title: 'Unsupported field',
      message: includeField
        ? `One of the fields isn’t available for this search (details: ${e.field}).`
        : 'One of the fields isn’t available for this search.',
    };
  }

  if (isSorting) {
    return {
      title: 'Sorting not available',
      message: 'That sort option can’t be used here. Try a different sort or remove sorting.',
    };
  }

  if (isSyntax) {
    return {
      title: 'We couldn’t understand the search',
      message: 'Check for typos or unusual symbols, then try again.',
    };
  }

  if (e.error === SOLR_ERROR.BAD_RANGE_SYNTAX) {
    return {
      title: 'We couldn’t understand the search',
      message: '(i.e. make sure date ranges use [2010 TO 2018] format)',
    };
  }

  if (isInvalidValue) {
    return {
      title: 'Invalid value',
      message: 'One of the inputs looks off. Adjust it and try again.',
    };
  }

  if (e.error === SOLR_ERROR.PARAM_OUT_OF_RANGE_OR_MISSING) {
    return {
      title: 'Missing or invalid option',
      message: 'Something about the current options isn’t valid. Adjust and try again.',
    };
  }

  // HTTP / infra / concurrency
  switch (e.error) {
    case SOLR_ERROR.VERSION_CONFLICT:
      return {
        title: 'Item changed',
        message: 'The item was updated elsewhere. Refresh and try again.',
      };
    case SOLR_ERROR.UNAUTHORIZED:
      return { title: 'Sign in required', message: 'Please sign in to continue.' };
    case SOLR_ERROR.FORBIDDEN:
      return { title: 'No access', message: 'You don’t have permission to do that.' };
    case SOLR_ERROR.NOT_FOUND:
      return { title: 'Not found', message: 'That resource isn’t available.' };
    case SOLR_ERROR.CONFLICT:
      return { title: 'Request conflict', message: 'Please refresh and try again.' };
    case SOLR_ERROR.SERVICE_UNAVAILABLE:
      return { title: 'Temporarily unavailable', message: 'Please try again in a moment.' };
    case SOLR_ERROR.SERVER_ERROR:
      return { title: 'Something went wrong', message: 'Please try again.' };
    case SOLR_ERROR.UNKNOWN:
    default:
      return { title: 'Search error', message: 'Please try again.' };
  }
};
