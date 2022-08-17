import { Box, List, ListItem, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@chakra-ui/react';
import { SimpleLink } from '@components/SimpleLink';
import { ReactElement, useEffect, useState } from 'react';
import { ILineGraph } from '../../types';
import { NodeDetailPane } from './NodeDetailsPane';
import { SummaryPane } from './SummaryPane';

export interface IAuthorNetworkNodeDetails {
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

export type NetworkDetailsProps = {
  node: IAuthorNetworkNodeDetails;
  summaryGraph: ILineGraph;
  onAddToFilter: (node: IAuthorNetworkNodeDetails) => void;
  onRemoveFromFilter: (node: IAuthorNetworkNodeDetails) => void;
  canAddAsFilter: boolean;
};

export const NetworkDetailsPane = ({
  node,
  summaryGraph,
  onAddToFilter,
  onRemoveFromFilter,
  canAddAsFilter,
}: NetworkDetailsProps): ReactElement => {
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
