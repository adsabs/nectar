import { Alert, AlertIcon, Box, Flex, Text, VisuallyHidden } from '@chakra-ui/react';
import { useIsClient } from '@/lib/useIsClient';
import PT from 'prop-types';
import { HTMLAttributes, ReactElement } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { Item, IItemProps } from './Item';
import { useHighlights } from './useHighlights';
import { IDocsEntity } from '@/api/search/types';
import { handleBoundaryError } from '@/lib/errorHandler';

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

  const { highlights, showHighlights, isFetchingHighlights } = useHighlights();

  return (
    <Flex
      as="section"
      aria-label="Results"
      direction="column"
      aria-labelledby="results-title"
      id="results"
      {...divProps}
    >
      <VisuallyHidden as="h2" id="results-title">
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
