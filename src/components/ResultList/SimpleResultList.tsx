import { Alert, AlertIcon, Box, Flex, Text, VisuallyHidden } from '@chakra-ui/react';
import { useIsClient } from '@/lib/useIsClient';
import PT from 'prop-types';
import { HTMLAttributes, ReactElement } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { Item, IItemProps } from './Item';
import { IDocsEntity } from '@/api/search/types';
import { handleBoundaryError } from '@/lib/errorHandler';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { useHighlights } from './useHighlights';
import { parseQueryFromUrl } from '@/utils/common/search';

/**
 * Reads search params from the URL and delegates to useHighlights.
 * Falls back to an empty query when highlights are not applicable.
 */
const useHighlightsFromUrl = (showHighlights: boolean) => {
  const router = useRouter();
  const urlParams = useMemo(() => parseQueryFromUrl(router.asPath), [router.asPath]);
  const { highlights, isFetchingHighlights } = useHighlights(urlParams, showHighlights);
  return { highlights, isFetchingHighlights };
};

export interface ISimpleResultListProps extends HTMLAttributes<HTMLDivElement> {
  docs: IDocsEntity[];
  indexStart?: number;
  hideCheckboxes?: boolean;
  showOrcidAction?: boolean;
  hideActions?: boolean;
  allowHighlight?: boolean;
  useNormCite?: boolean;
}

const propTypes = {
  docs: PT.arrayOf(PT.object),
  indexStart: PT.number,
  hideCheckboxes: PT.bool,
};

/**
 * Error fallback for individual result items
 * Shows a minimal error message when a single item fails to render
 */
const ItemErrorFallback = ({ bibcode }: { bibcode: string } & FallbackProps) => (
  <Box border="1px" borderColor="red.200" borderRadius="md" mb={1} p={3}>
    <Alert status="error" variant="subtle" borderRadius="md">
      <AlertIcon />
      <Text fontSize="sm">Unable to display this result ({bibcode})</Text>
    </Alert>
  </Box>
);

/**
 * Wraps an Item component with an error boundary to prevent one bad record
 * from crashing the entire results list
 */
const SafeItem = (props: IItemProps) => (
  <ErrorBoundary
    onError={(error, errorInfo) =>
      handleBoundaryError(error, errorInfo, { component: 'Item', bibcode: props.doc.bibcode })
    }
    fallbackRender={(fallbackProps) => <ItemErrorFallback {...fallbackProps} bibcode={props.doc.bibcode} />}
  >
    <Item {...props} />
  </ErrorBoundary>
);

export const SimpleResultList = (props: ISimpleResultListProps): ReactElement => {
  const {
    docs = [],
    hideCheckboxes = false,
    indexStart = 0,
    hideActions = false,
    allowHighlight = true,
    useNormCite = false,
    ...divProps
  } = props;

  const isClient = useIsClient();
  const start = indexStart + 1;

  // Read showHighlights from URL. nuqs maps showHighlights → 'hl' in the URL,
  // so router.query contains 'hl', not 'showHighlights'.
  const router = useRouter();
  const showHighlights = router.query.hl === 'true';
  const { highlights, isFetchingHighlights } = useHighlightsFromUrl(showHighlights);

  return (
    <Flex
      as="section"
      aria-label="Results"
      direction="column"
      aria-labelledby="results-title"
      id="results"
      {...divProps}
    >
      <VisuallyHidden as="h3" id="results-title">
        Results
      </VisuallyHidden>
      {docs.map((doc, index) => (
        <SafeItem
          doc={doc}
          key={doc.bibcode}
          index={start + index}
          hideCheckbox={!isClient ? true : hideCheckboxes}
          hideActions={hideActions}
          showHighlights={allowHighlight && showHighlights}
          highlights={highlights?.[index] ?? {}}
          isFetchingHighlights={allowHighlight && isFetchingHighlights}
          useNormCite={useNormCite}
        />
      ))}
    </Flex>
  );
};
SimpleResultList.propTypes = propTypes;
