import { Alert, AlertIcon, Box, Flex, Text, VisuallyHidden } from '@chakra-ui/react';
import { useIsClient } from '@/lib/useIsClient';
import PT from 'prop-types';
import { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { Item, IItemProps } from './Item';
import { useHighlights } from './useHighlights';
import { useAbstracts } from './useAbstracts';
import { IDocsEntity } from '@/api/search/types';
import { handleBoundaryError } from '@/lib/errorHandler';
import { useResultsRenderSpan } from '@/lib/useRenderSpan';
import { useIsPrinting } from '@/lib/useIsPrinting';
import { VirtualResultRows } from './VirtualResultRows';
import { VIRTUALIZE_ABOVE_ROWS } from '@/config';

export interface ISimpleResultListProps extends HTMLAttributes<HTMLDivElement> {
  docs: IDocsEntity[];
  indexStart?: number;
  hideCheckboxes?: boolean;
  showOrcidAction?: boolean;
  hideActions?: boolean;
  allowHighlight?: boolean;
  allowAbstracts?: boolean;
  useNormCite?: boolean;
  // Opt-in: this list is also used off the search page (abstract refs, library
  // lists), which must not emit search.*.render spans.
  measureRenderSpan?: boolean;
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
    allowAbstracts = true,
    useNormCite = false,
    measureRenderSpan = false,
    ...divProps
  } = props;

  const isClient = useIsClient();
  const start = indexStart + 1;
  const isPrinting = useIsPrinting();
  const isWindowed = isClient && !isPrinting && docs.length > VIRTUALIZE_ABOVE_ROWS;

  useResultsRenderSpan(docs, measureRenderSpan, isWindowed);

  const { highlights, showHighlights, isFetchingHighlights } = useHighlights();
  const resultsHaveAbstracts = docs.some((doc) => typeof doc.abstract === 'string');
  const { abstracts, isFetchingAbstracts } = useAbstracts({ enabled: allowAbstracts && !resultsHaveAbstracts });

  const renderRow = (doc: IDocsEntity, index: number): ReactNode => (
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
      abstract={doc.abstract ?? abstracts[doc.bibcode]}
      isFetchingAbstract={isFetchingAbstracts}
      allowAbstracts={allowAbstracts}
      containment={!isWindowed}
    />
  );

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
      {isWindowed ? (
        <VirtualResultRows docs={docs} renderRow={renderRow} />
      ) : (
        docs.map((doc, index) => renderRow(doc, index))
      )}
    </Flex>
  );
};
SimpleResultList.propTypes = propTypes;
