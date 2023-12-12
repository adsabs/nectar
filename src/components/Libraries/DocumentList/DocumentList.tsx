import { IDocsEntity } from '@api';
import { Flex, VisuallyHidden } from '@chakra-ui/react';
import { noop } from '@utils';
import { HTMLAttributes } from 'react';
import { DocumentItem } from './DocumentItem';

export interface ISimpleResultListProps extends HTMLAttributes<HTMLDivElement> {
  docs: IDocsEntity[];
  indexStart?: number;
  selectedBibcodes?: string[];
  onSet?: (bibcode: string, checked: boolean) => void;
  hideCheckbox: boolean;
  hideResources?: boolean;
}

export const DocumentList = (props: ISimpleResultListProps) => {
  const {
    docs = [],
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
          key={doc.bibcode}
          index={start + index}
          hideCheckbox={hideCheckbox}
          isChecked={selectedBibcodes?.includes(doc.bibcode)}
          onSet={(checked) => onSet(doc.bibcode, checked)}
          hideResources={hideResources}
        />
      ))}
    </Flex>
  );
};
