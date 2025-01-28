import { Flex, VisuallyHidden } from '@chakra-ui/react';
import { useIsClient } from '@/lib/useIsClient';
import PT from 'prop-types';
import { HTMLAttributes, ReactElement, useMemo } from 'react';
import { Item } from './Item';
import { useHighlights } from './useHighlights';
import { IDocsEntity } from '@/api/search/types';
import { useGetExportCitation } from '@/api/export/export';
import { useSettings } from '@/lib/useSettings';
import { citationFormats } from '../CitationExporter';
import { logger } from '@/logger';
import { values } from 'ramda';

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

  const { settings } = useSettings();
  const { defaultCitationFormat } = settings;

  const bibcodes = docs.map((d) => d.bibcode).sort();

  const { data: citationData } = useGetExportCitation(
    {
      format: values(citationFormats).find((f) => f.value === defaultCitationFormat).id,
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
          useNormCite={useNormCite}
          defaultCitation={defaultCitations?.get(doc.bibcode)}
        />
      ))}
    </Flex>
  );
};
SimpleResultList.propTypes = propTypes;
