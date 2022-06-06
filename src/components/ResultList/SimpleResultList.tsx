import { IADSApiSearchResponse, IDocsEntity } from '@api';
import { Flex, VisuallyHidden } from '@chakra-ui/react';
import { useIsClient } from '@hooks/useIsClient';
import PT from 'prop-types';
import { HTMLAttributes, ReactElement, useMemo } from 'react';
import { Item } from './Item';

export interface ISimpleResultListProps extends HTMLAttributes<HTMLDivElement> {
  docs: IDocsEntity[];
  indexStart?: number;
  hideCheckboxes?: boolean;
  showHighlights?: boolean;
  highlightsData?: IADSApiSearchResponse['highlighting'];
  highlightsIsLoading?: boolean;
}

const propTypes = {
  docs: PT.arrayOf(PT.object),
  hideCheckboxes: PT.bool,
  showHighlights: PT.bool,
};

export const SimpleResultList = (props: ISimpleResultListProps): ReactElement => {
  const {
    docs = [],
    hideCheckboxes = false,
    showHighlights = false,
    indexStart = 0,
    highlightsData,
    highlightsIsLoading,
    ...divProps
  } = props;

  // Highlight data to {id: [...highlight strings]}
  const highlights: { [id: string]: string[] } = useMemo(() => {
    if (highlightsData) {
      const res: { [key: string]: string[] } = {};
      Object.keys(highlightsData).forEach((key) => {
        res[key] = [];
        if (highlightsData[key].title) {
          res[key].push(...highlightsData[key].title);
        }
        if (highlightsData[key].abstract) {
          res[key].push(...highlightsData[key].abstract);
        }
      });
      return res;
    }
  }, [highlightsData]);

  const isClient = useIsClient();

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
        <Item
          doc={doc}
          key={doc.bibcode}
          index={start + index}
          hideCheckbox={!isClient ? true : hideCheckboxes}
          hideActions={false}
          showHighlights={showHighlights}
          highlights={highlights?.[doc.id]}
        />
      ))}
    </Flex>
  );
};
SimpleResultList.propTypes = propTypes;
