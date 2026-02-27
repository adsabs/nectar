import {
  Box,
  Button,
  Code,
  Collapse,
  HStack,
  Icon,
  Link,
  Spacer,
  Text,
  Tooltip,
  useClipboard,
  useColorModeValue,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { CopyIcon, WarningIcon } from '@chakra-ui/icons';
import { AxiosError } from 'axios';
import { IADSApiSearchResponse } from '@/api/search/types';
import { SimpleLink } from '@/components/SimpleLink';
import { ParsedSolrError, SOLR_ERROR, useSolrError } from '@/lib/useSolrError';

interface ISolrErrorAlertProps {
  error: AxiosError<IADSApiSearchResponse> | Error;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const SearchErrorAlert = ({ error, onRetry, isRetrying = false }: ISolrErrorAlertProps) => {
  const data = useSolrError(error);
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: false });
  const detailsId = 'search-error-details';
  const { onCopy, hasCopied } = useClipboard(
    typeof data?.originalMsg === 'string' ? data.originalMsg : String(data?.originalMsg ?? ''),
  );
  const { title, message } = solrErrorToCopy(data, { includeFieldName: !!data.field });

  const errorMsg = typeof data?.originalMsg === 'string' ? data.originalMsg : String(data?.originalMsg ?? '');
  const feedbackUrl = errorMsg
    ? `/feedback/general?${new URLSearchParams({
        from: 'search',
        error_details: errorMsg.slice(0, 2000),
      }).toString()}`
    : '/feedback/general?from=search';

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('red.100', 'whiteAlpha.200');
  const accentBarColor = useColorModeValue('red.500', 'red.400');
  const titleColor = useColorModeValue('blue.800', 'white');
  const descColor = useColorModeValue('gray.900', 'gray.400');
  const shadow = useColorModeValue('md', '2xl');
  const codeBg = useColorModeValue('gray.100', 'whiteAlpha.300');
  const linkColor = useColorModeValue('gray.800', 'gray.500');
  const tryAgainBorderColor = useColorModeValue('red.200', 'red.600');
  const tryAgainColor = useColorModeValue('red.600', 'red.300');
  const tryAgainBg = useColorModeValue('white', 'gray.700');
  const tryAgainHoverBg = useColorModeValue('red.50', 'whiteAlpha.100');
  const copyBorderColor = useColorModeValue('gray.300', 'whiteAlpha.300');
  const copyHoverBg = useColorModeValue('gray.50', 'whiteAlpha.100');

  return (
    <Box
      w="full"
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      shadow={shadow}
      overflow="hidden"
      position="relative"
      role="alert"
    >
      <Box position="absolute" left={0} top={0} bottom={0} w="4px" bg={accentBarColor} />

      <VStack align="start" p={5} spacing={3} pl={8}>
        <HStack spacing={3}>
          <Icon as={WarningIcon} color={accentBarColor} boxSize={4} />
          <Text fontWeight="600" color={titleColor} fontSize="md">
            {title}
          </Text>
        </HStack>

        <Text color={descColor} fontSize="sm" lineHeight="1.6">
          {message}
        </Text>

        <HStack w="full" spacing={3} pt={2} wrap="wrap" align="center">
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              borderColor={tryAgainBorderColor}
              color={tryAgainColor}
              bg={tryAgainBg}
              borderRadius="4px"
              px={5}
              isLoading={isRetrying}
              _hover={{ bg: tryAgainHoverBg }}
            >
              Try Again
            </Button>
          )}
          <Tooltip label={hasCopied ? 'Copied!' : 'Copy full error'}>
            <Button
              onClick={onCopy}
              leftIcon={<CopyIcon />}
              variant="outline"
              size="sm"
              borderColor={copyBorderColor}
              color={titleColor}
              borderRadius="4px"
              px={5}
              _hover={{ bg: copyHoverBg }}
            >
              {hasCopied ? 'Copied' : 'Copy'}
            </Button>
          </Tooltip>

          <Spacer />

          <HStack spacing={4}>
            <Link
              as="button"
              fontSize="xs"
              color={linkColor}
              aria-label="toggle error details"
              aria-controls={detailsId}
              onClick={onToggle}
              _hover={{ color: 'red.400', textDecoration: 'underline' }}
            >
              {isOpen ? 'Hide' : 'Show'} Details
            </Link>
            <SimpleLink
              href={feedbackUrl}
              fontSize="xs"
              color={linkColor}
              display="inline-flex"
              alignItems="center"
              gap={1}
              _hover={{ color: 'red.400', textDecoration: 'underline' }}
            >
              Report this issue
            </SimpleLink>
          </HStack>
        </HStack>

        <Collapse in={isOpen} animateOpacity>
          <Code
            id={detailsId}
            p={3}
            display="block"
            whiteSpace="pre-wrap"
            w="full"
            fontSize="xs"
            bg={codeBg}
            borderRadius="md"
          >
            {data?.originalMsg}
          </Code>
        </Collapse>
      </VStack>
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
