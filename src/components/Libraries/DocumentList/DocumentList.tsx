import { IDocsEntity, INote, LibraryIdentifier } from '@api';
import { Flex, VisuallyHidden } from '@chakra-ui/react';
import { noop } from '@utils';
import { HTMLAttributes, ReactElement } from 'react';
import { DocumentItem } from './DocumentItem';

export interface ISimpleResultListProps extends HTMLAttributes<HTMLDivElement> {
  library: LibraryIdentifier;
  docs: IDocsEntity[];
  notes?: { [key in string]: INote };
  showNotes: boolean;
  canEdit: boolean;
  onNoteUpdate: () => void;
  indexStart?: number;
  selectedBibcodes?: string[];
  onSet?: (bibcode: string, checked: boolean) => void;
  hideCheckbox: boolean;
  hideResources?: boolean;
}

export const DocumentList = (props: ISimpleResultListProps): ReactElement => {
  const {
    library,
    docs = [],
    notes,
    showNotes,
    canEdit,
    onNoteUpdate,
    selectedBibcodes = [],
    indexStart = 0,
    hideCheckbox,
    onSet = noop,
    hideResources = false,
    ...divProps
  } = props;

  const start = indexStart + 1;

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
        <DocumentItem
          doc={doc}
          library={library}
          canEdit={canEdit}
          note={notes?.[doc.bibcode]?.content ?? ''}
          onNoteUpdate={onNoteUpdate}
          key={doc.bibcode}
          index={start + index}
          hideCheckbox={hideCheckbox}
          isChecked={selectedBibcodes?.includes(doc.bibcode)}
          onSet={(checked) => onSet(doc.bibcode, checked)}
          hideResources={hideResources}
          showNote={showNotes}
        />
      ))}
    </Flex>
  );
};
