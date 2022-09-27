import { IDocsEntity } from '@api';
import { Flex, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { Item } from '@components/ResultList/Item';
import { ILineGraph } from '@components/Visualizations/types';
import { ReactElement, useEffect, useState } from 'react';
import { NodeDetailPane } from './NodeDetailsPane';
import { SummaryPane } from './SummaryPane';

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

  // when selected node changes, change tab to node details
  useEffect(() => {
    setTabIndex(node ? 1 : 0);
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
    <Flex as="section" aria-label="Papers List" direction="column">
      {papers.map((doc, index) => (
        <Item
          doc={doc}
          key={doc.bibcode}
          index={index + 1}
          hideCheckbox={true}
          hideActions={true}
          showHighlights={false}
          extraInfo={
            doc.groupAuthorCount
              ? `${doc.groupAuthorCount} author${doc.groupAuthorCount > 1 ? 's' : ''} from this group`
              : null
          }
          linkNewTab={true}
        />
      ))}
    </Flex>
  );
};
