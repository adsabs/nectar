import { IDocsEntity } from '@api';
import { Flex, VisuallyHidden } from '@chakra-ui/react';
import { useOrcid } from '@lib/orcid/useOrcid';
import { useIsClient } from '@lib/useIsClient';
import { noop } from '@utils';
import PT from 'prop-types';
import { HTMLAttributes, ReactElement } from 'react';
import { Item } from './Item';
import { useHighlights } from './useHighlights';

export interface ISimpleResultListProps extends HTMLAttributes<HTMLDivElement> {
  docs: IDocsEntity[];
  indexStart?: number;
  hideCheckboxes?: boolean;
  showOrcidAction?: boolean;
  onAddClaim?: (identifier: string) => void;
  onDeleteClaim?: (identifier: string) => void;
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
    showOrcidAction = false,
    onAddClaim = noop,
    onDeleteClaim = noop,
    ...divProps
  } = props;

  const isClient = useIsClient();
  const start = indexStart + 1;

  const { highlights, showHighlights, isFetchingHighlights } = useHighlights();

  const { profile } = useOrcid();

  const orcidClaimed = profile ? new Set(Object.keys(profile)) : new Set();

  const handleAddClaim = (identifier: string) => {
    onAddClaim(identifier);
  };

  const handleDeleteClaim = (identifier: string) => {
    onDeleteClaim(identifier);
  };

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
          hideActions={false}
          showHighlights={showHighlights}
          highlights={highlights[index]}
          isFetchingHighlights={isFetchingHighlights}
          showOrcidAction={showOrcidAction}
          orcidClaimed={doc.identifier.filter((id) => orcidClaimed.has(id)).length > 0}
          onAddClaim={handleAddClaim}
          onDeleteClaim={handleDeleteClaim}
        />
      ))}
    </Flex>
  );
};
SimpleResultList.propTypes = propTypes;
