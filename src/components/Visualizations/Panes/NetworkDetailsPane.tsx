import { Box, Flex, List, ListItem, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@chakra-ui/react';
import { SimpleLink } from '@components/SimpleLink';
import { ReactElement } from 'react';

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
}

export const NetworkDetailsPane = ({ node }: INetworkDetailsProps): ReactElement => {
  return (
    <Tabs variant="soft-rounded">
      <TabList>
        <Tab>Summary</Tab>
        <Tab>Detail</Tab>
      </TabList>
      <TabPanels>
        <TabPanel></TabPanel>
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
