import { Box, Flex, List, ListItem, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@chakra-ui/react';
import { CustomInfoMessage } from '@components/Alert';
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
}

export const NetworkDetailsPane = ({ node, summaryGraph }: INetworkDetailsProps): ReactElement => {
  const notEnoughData = !summaryGraph.error && summaryGraph.data.find((serie) => serie.data.length > 1) === undefined;

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

  return (
    <Tabs variant="soft-rounded" index={tabIndex} onChange={handleTabIndexChange}>
      <TabList>
        <Tab>Summary</Tab>
        <Tab>Detail</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          {summaryGraph.error && (
            <CustomInfoMessage
              status={'error'}
              title="Cannot generate network"
              description={summaryGraph.error.message}
            />
          )}
          {!summaryGraph.error && notEnoughData ? (
            <CustomInfoMessage status={'info'} title="Not enough data to generate graph" />
          ) : (
            <>
              <Text>Group Activity Over Time (measured in papers published)</Text>
              <LineGraph data={summaryGraph.data} ticks={getLineGraphXTicks(summaryGraph.data, 5)} />
            </>
          )}
        </TabPanel>
        <TabPanel>
          <>
            {node ? (
              <Flex direction="column">
                <Text as="h3" fontSize="xl" fontWeight="bold">
                  {node.name}
                </Text>
                <Text>
                  Total papers: {node.papers.length}, most recent: {node.mostRecentYear}
                </Text>
                <PapersList papers={node.papers} />
              </Flex>
            ) : (
              <span>Select an item from the graph to view its details</span>
            )}
          </>
        </TabPanel>
      </TabPanels>
    </Tabs>
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
