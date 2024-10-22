import { Flex, VisuallyHidden } from '@chakra-ui/react';
import { HTMLAttributes, ReactElement } from 'react';
import { DocumentItem } from './DocumentItem';
import { noop } from '@/utils/common/noop';
import { INote, LibraryIdentifier } from '@/api/biblib/types';
import { IDocsEntity } from '@/api/search/types';

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
  useNormCite?: boolean;
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
    useNormCite = false,
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
          useNormCite={useNormCite}
        />
      ))}
    </Flex>
  );
};
