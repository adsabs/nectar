import { Box, Button, Flex, List, ListItem, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@chakra-ui/react';
import { CustomInfoMessage } from '@components/Feedbacks';
import { SimpleLink } from '@components/SimpleLink';
import { ReactElement, useEffect, useState } from 'react';
import { LineGraph } from '../Graphs';
import { ILineGraph } from '../types';
import { getLineGraphXTicks } from '../utils';

export interface INodeDetails {
  type: 'author' | 'group';
  name: string;
  papers: {
    bibcode: string;
    title: string;
    authors: string[];
    citation_count: number;
    read_count: number;
    groupAuthorCount?: number;
  }[];
  mostRecentYear: string;
}

export interface INetworkDetailsProps {
  node: INodeDetails;
  summaryGraph: ILineGraph;
  onAddToFilter: (node: INodeDetails) => void;
  onRemoveFromFilter: (node: INodeDetails) => void;
  canAddAsFilter: boolean;
}

export const NetworkDetailsPane = ({
  node,
  summaryGraph,
  onAddToFilter,
  onRemoveFromFilter,
  canAddAsFilter,
}: INetworkDetailsProps): ReactElement => {
  const [tabIndex, setTabIndex] = useState(0);

  // when selected node changes, change tab to node details
  useEffect(() => {
    if (node) {
      setTabIndex(1);
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
    <Tabs variant="soft-rounded" index={tabIndex} onChange={handleTabIndexChange}>
      <TabList>
        <Tab>Summary</Tab>
        <Tab>Detail</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <SummaryPane summaryGraph={summaryGraph} />
        </TabPanel>
        <TabPanel>
          <NodeDetailPane
            node={node}
            canAddAsFilter={canAddAsFilter}
            onAddToFilter={handleAddToFilter}
            onRemoveFromFilter={handleRemoveFromFilter}
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

// Show summary graph
const SummaryPane = ({ summaryGraph }: { summaryGraph: ILineGraph }) => {
  const notEnoughData = !summaryGraph.error && summaryGraph.data.find((serie) => serie.data.length > 1) === undefined;

  return (
    <>
      {summaryGraph.error && (
        <CustomInfoMessage status={'error'} title="Cannot generate network" description={summaryGraph.error.message} />
      )}
      {!summaryGraph.error && notEnoughData ? (
        <CustomInfoMessage status={'info'} title="Not enough data to generate graph" />
      ) : (
        <>
          <Text>Group Activity Over Time (measured in papers published)</Text>
          <LineGraph data={summaryGraph.data} ticks={getLineGraphXTicks(summaryGraph.data, 5)} />
        </>
      )}
    </>
  );
};

// Show selected node details
const NodeDetailPane = ({
  node,
  canAddAsFilter,
  onAddToFilter,
  onRemoveFromFilter,
}: {
  node: INodeDetails;
  canAddAsFilter: boolean;
  onAddToFilter: () => void;
  onRemoveFromFilter: () => void;
}) => {
  return (
    <>
      {node ? (
        <Flex direction="column">
          <Flex justifyContent="space-between">
            <Text as="h3" fontSize="xl" fontWeight="bold">
              {node.name}
            </Text>
            {canAddAsFilter ? (
              <Button w="fit-content" ml={5} variant="outline" onClick={onAddToFilter}>
                Add to filter
              </Button>
            ) : (
              <Button w="fit-content" ml={5} variant="outline" color="red.500" onClick={onRemoveFromFilter}>
                Remove filter
              </Button>
            )}
          </Flex>
          <Text>
            Total papers: {node.papers.length}, most recent: {node.mostRecentYear}
          </Text>
          <PapersList papers={node.papers} />
        </Flex>
      ) : (
        <span>Select an item from the graph to view its details</span>
      )}
    </>
  );
};

const PapersList = ({ papers }: { papers: INodeDetails['papers'] }): ReactElement => {
  return (
    <Box mt={5}>
      <List spacing={3}>
        {papers.map((paper) => (
          <ListItem key={paper.bibcode}>
            <SimpleLink href={`/abs/${paper.bibcode}`} newTab={true}>
              <Text fontWeight="bold" as="span" dangerouslySetInnerHTML={{ __html: paper.title }} />
            </SimpleLink>{' '}
            <Text as="span" fontSize="sm">
              {paper.citation_count && paper.citation_count > 0 ? (
                <>{paper.citation_count} citations</>
              ) : (
                <>no citations</>
              )}

              {paper.groupAuthorCount && (
                <>{`, ${paper.groupAuthorCount} author${paper.groupAuthorCount > 1 ? 's' : ''} from this group`}</>
              )}
            </Text>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};
