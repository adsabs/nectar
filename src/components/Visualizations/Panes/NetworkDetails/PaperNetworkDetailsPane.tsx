import { IADSApiPaperNetworkSummaryGraphNode, IADSApiPaperNetworkFullGraphNode } from '@api';
import {
  Text,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Box,
  List,
  ListItem,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
} from '@chakra-ui/react';
import { SimpleLink } from '@components/SimpleLink';
import { ILineGraph } from '@components/Visualizations/types';
import { ReactElement, useEffect, useState } from 'react';
import { NodeDetailPane } from './NodeDetailsPane';
import { SummaryPane } from './SummaryPane';

export interface IPaperNetworkNodeDetails extends IADSApiPaperNetworkSummaryGraphNode {
  allPapers: IADSApiPaperNetworkFullGraphNode[];
  titleWords: string[];
  topCommonReferences: {
    bibcode: string;
    percent: string;
    inGroup: boolean;
  }[];
}

export interface IPaperNetworkLinkDetails {
  groupOne: { name: string; color: string };
  groupTwo: { name: string; color: string };
  papers: { bibcode: string; percent1: number; percent2: number }[];
}

export type PaperNetworkDetailsProps = {
  node?: IPaperNetworkNodeDetails;
  link?: IPaperNetworkLinkDetails;
  summaryGraph: ILineGraph;
  onAddToFilter: (node: IPaperNetworkNodeDetails) => void;
  onRemoveFromFilter: (node: IPaperNetworkNodeDetails) => void;
  canAddAsFilter: boolean;
};

export const PaperNetworkDetailsPane = ({
  node,
  link,
  summaryGraph,
  onAddToFilter,
  onRemoveFromFilter,
  canAddAsFilter,
}: PaperNetworkDetailsProps): ReactElement => {
  const [tabIndex, setTabIndex] = useState(0);

  // when selected node changes, change tab to node details
  useEffect(() => {
    setTabIndex(node || link ? 1 : 0);
  }, [node, link]);

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
              title={`Group ${node.node_name}: ${node.titleWords.join(', ')}`}
              description={`This group consists of ${node.paper_count} papers, which have been cited, in total, ${node.total_citations} times.`}
              content={<PapersList node={node} />}
              canAddAsFilter={canAddAsFilter}
              onAddToFilter={handleAddToFilter}
              onRemoveFromFilter={handleRemoveFromFilter}
            />
          ) : link ? (
            <ReferencesList link={link} />
          ) : (
            <span>Select an item from the graph to view its details</span>
          )}
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

const PapersList = ({ node }: { node: IPaperNetworkNodeDetails }): ReactElement => {
  const { allPapers, topCommonReferences } = node;
  return (
    <Box mt={5}>
      <Text fontWeight="bold">{allPapers.length > 30 ? 'Top 30 papers from this group' : 'Papers in this group'}</Text>
      <List spacing={3} mt={5}>
        {allPapers.slice(0, 30).map((paper) => (
          <ListItem key={`paper-${paper.id}`}>
            <SimpleLink href={`/abs/${paper.node_name}`} newTab={true}>
              <Text fontWeight="bold" as="span" dangerouslySetInnerHTML={{ __html: paper.title }} />
            </SimpleLink>
            <Text as="span">{paper.first_author}</Text>
            <Text as="span" fontSize="sm">
              {paper.citation_count && paper.citation_count > 0 ? (
                <> ({paper.citation_count} citations)</>
              ) : (
                <> (no citations)</>
              )}
            </Text>
          </ListItem>
        ))}
      </List>
      <Text fontWeight="bold" mt={5}>
        Papers highly referenced by papers in this group:
      </Text>
      <List spacing={3} mt={5}>
        {topCommonReferences
          .filter((r) => !r.inGroup)
          .map((r) => (
            <ListItem key={`topref-${r.bibcode}`}>
              <SimpleLink href={`/abs/${r.bibcode}`} newTab={true}>
                <Text fontWeight="bold" as="span">
                  {r.bibcode}
                </Text>
              </SimpleLink>
              <Text>cited by {r.percent}% of papers in this group</Text>
            </ListItem>
          ))}
      </List>
    </Box>
  );
};

const ReferencesList = ({ link }: { link: IPaperNetworkLinkDetails }): ReactElement => {
  const { groupOne, groupTwo, papers } = link;
  return (
    <Box mt={5}>
      <Text as="h3" fontSize="xl" fontWeight="bold">
        References From Both <span style={{ color: groupOne.color }}>{groupOne.name}</span> and{' '}
        <span style={{ color: groupTwo.color }}>{groupTwo.name}</span>
      </Text>
      <Text>The groups have {papers.length} unique references in common</Text>
      <Table mt={5}>
        <Thead>
          <Tr>
            <Th>Papers</Th>
            <Th>{groupOne.name}</Th>
            <Th>{groupTwo.name}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {papers.map((p) => (
            <Tr key={`ref-${p.bibcode}`}>
              <Th>
                <SimpleLink href={`/abs/${p.bibcode}`}>{p.bibcode}</SimpleLink>
              </Th>
              <Th>{`${p.percent1.toFixed(2)}%`}</Th>
              <Th>{`${p.percent2.toFixed(2)}%`}</Th>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};
