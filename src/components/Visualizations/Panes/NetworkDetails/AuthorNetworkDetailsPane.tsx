import { Box, Flex, HStack, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@chakra-ui/react';
import { ILineGraph } from '@/components/Visualizations/types';
import { equals } from 'ramda';
import { ReactElement, useEffect, useRef, useState } from 'react';
import { NodeDetailPane } from './NodeDetailsPane';
import { SummaryPane } from './SummaryPane';

import { MathJax } from 'better-react-mathjax';
import { SimpleLink } from '@/components/SimpleLink';
import { unwrapStringValue } from '@/utils/common/formatters';
import { IDocsEntity } from '@/api/search/types';

interface Paper extends IDocsEntity {
  groupAuthorCount?: number;
}

export interface IAuthorNetworkNodeDetails {
  type: 'author' | 'group';
  name: string;
  papers: Paper[];
  mostRecentYear: string;
}

export type AuthorNetworkDetailsProps = {
  node: IAuthorNetworkNodeDetails;
  summaryGraph: ILineGraph;
  onAddToFilter: (node: IAuthorNetworkNodeDetails) => void;
  onRemoveFromFilter: (node: IAuthorNetworkNodeDetails) => void;
  canAddAsFilter: boolean;
};

export const AuthorNetworkDetailsPane = ({
  node,
  summaryGraph,
  onAddToFilter,
  onRemoveFromFilter,
  canAddAsFilter,
}: AuthorNetworkDetailsProps): ReactElement => {
  const [tabIndex, setTabIndex] = useState(0);

  // prevent tab switching during re-render
  const prevNode = useRef<IAuthorNetworkNodeDetails>(null);

  // when selected node changes, change tab to node details
  useEffect(() => {
    if (!equals(node, prevNode.current)) {
      setTabIndex(node ? 1 : 0);
      prevNode.current = node;
    }
  }, [node]);

  const handleTabIndexChange = (index: number) => {
    setTabIndex(index);
  };

  const handleAddToFilter = () => {
    onAddToFilter(node);
  };

  const handleRemoveFromFilter = () => {
    onRemoveFromFilter(node);
  };

  return (
    <Tabs variant="solid-rounded" index={tabIndex} onChange={handleTabIndexChange}>
      <TabList>
        <Tab>Summary</Tab>
        <Tab>Detail</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <SummaryPane summaryGraph={summaryGraph} />
        </TabPanel>
        <TabPanel>
          {node ? (
            <NodeDetailPane
              title={node.name}
              description={`Total papers: ${node.papers.length}, most recent: ${node.mostRecentYear}`}
              content={<PapersList papers={node.papers} />}
              canAddAsFilter={canAddAsFilter}
              onAddToFilter={handleAddToFilter}
              onRemoveFromFilter={handleRemoveFromFilter}
            />
          ) : (
            <span>Select an item from the graph to view its details</span>
          )}
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

const PapersList = ({ papers }: { papers: IAuthorNetworkNodeDetails['papers'] }): ReactElement => {
  return (
    <Flex as="section" aria-label="Papers List" direction="column">
      {papers.map((paper) => (
        <PaperItem paper={paper} key={paper.bibcode} />
      ))}
    </Flex>
  );
};

const PaperItem = ({ paper }: { paper: Paper }) => {
  const { bibcode, title, citation_count, groupAuthorCount } = paper;

  const cite =
    typeof citation_count === 'number' && citation_count > 0 ? (
      <SimpleLink href={{ pathname: `/abs/${bibcode}/citations`, search: 'p=1' }} newTab>
        cited: {citation_count}
      </SimpleLink>
    ) : null;

  return (
    <Box my={0.5}>
      <SimpleLink href={`/abs/${bibcode}/abstract`} fontWeight="semibold">
        <Text as={MathJax} dangerouslySetInnerHTML={{ __html: unwrapStringValue(title) }} />
      </SimpleLink>
      <HStack>
        <Text fontSize="sm">
          {groupAuthorCount ? `${groupAuthorCount} author${groupAuthorCount > 1 ? 's' : ''} from this group` : null}
        </Text>
        <Text fontSize="sm">{cite}</Text>
      </HStack>
    </Box>
  );
};
