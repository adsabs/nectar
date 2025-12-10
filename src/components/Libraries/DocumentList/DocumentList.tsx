import { Flex, VisuallyHidden } from '@chakra-ui/react';
import { HTMLAttributes, ReactElement, useMemo } from 'react';
import { DocumentItem } from './DocumentItem';
import { noop } from '@/utils/common/noop';
import { INote, LibraryIdentifier } from '@/api/biblib/types';
import { IDocsEntity } from '@/api/search/types';
import { useGetExportCitation } from '@/api/export/export';
import { useSettings } from '@/lib/useSettings';
import { logger } from '@/logger';

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

  const { settings } = useSettings();
  const { defaultCitationFormat } = settings;
  const bibcodes = docs.map((d) => d.bibcode).sort();

  const { data: citationData } = useGetExportCitation(
    {
      format: defaultCitationFormat,
      bibcode: bibcodes,
      sort: ['bibcode asc'],
    },
    { enabled: !!settings?.defaultCitationFormat },
  );

  // a map from bibcode to citation
  const defaultCitations = useMemo(() => {
    const citationSet = new Map<string, string>();
    try {
      if (!!citationData) {
        citationData.export.split('\n').forEach((c, index) => {
          citationSet.set(bibcodes[index], c);
        });
      }
    } catch (err) {
      logger.error({ err }, 'Error processing citation data');
    }
    return citationSet;
  }, [citationData, bibcodes]);

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
          defaultCitation={defaultCitations?.get(doc.bibcode)}
        />
      ))}
    </Flex>
  );
};
