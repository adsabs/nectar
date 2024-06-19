import { IDocsEntity } from '@/api';
import { Flex, VisuallyHidden } from '@chakra-ui/react';
import { useIsClient } from '@/lib/useIsClient';
import PT from 'prop-types';
import { HTMLAttributes, ReactElement } from 'react';
import { Item } from './Item';
import { useHighlights } from './useHighlights';

export interface ISimpleResultListProps extends HTMLAttributes<HTMLDivElement> {
  docs: IDocsEntity[];
  indexStart?: number;
  hideCheckboxes?: boolean;
  showOrcidAction?: boolean;
  hideActions?: boolean;
  allowHighlight?: boolean;
}

const propTypes = {
  docs: PT.arrayOf(PT.object),
  indexStart: PT.number,
  hideCheckboxes: PT.bool,
};

export const SimpleResultList = (props: ISimpleResultListProps): ReactElement => {
  const {
    docs = [],
    hideCheckboxes = false,
    indexStart = 0,
    hideActions = false,
    allowHighlight = true,
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
        <Item
          doc={doc}
          key={doc.bibcode}
          index={start + index}
          hideCheckbox={!isClient ? true : hideCheckboxes}
          hideActions={hideActions}
          showHighlights={allowHighlight && showHighlights}
          highlights={highlights?.[index] ?? []}
          isFetchingHighlights={allowHighlight && isFetchingHighlights}
        />
      ))}
    </Flex>
  );
};
SimpleResultList.propTypes = propTypes;
