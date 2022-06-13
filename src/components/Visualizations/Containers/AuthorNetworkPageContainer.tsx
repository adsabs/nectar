import { IADSApiSearchParams, useSearch } from '@api';
import { IADSApiVisResponse } from '@api/vis/types';
import { useGetAuthorNetwork } from '@api/vis/vis';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@chakra-ui/alert';
import { Box, CircularProgress, Flex, Text } from '@chakra-ui/react';
import { ReactElement, useMemo, useState } from 'react';
import { NetworkGraphPane } from '../GraphPanes';
import { ISunburstGraph } from '../types';

interface IAuthorNetworkPageContainerProps {
  query: IADSApiSearchParams;
}

type View = 'author_occurrences' | 'paper_citations' | 'paper_downloads';

const views: { id: View; label: string }[] = [
  { id: 'author_occurrences', label: 'Author Occurrences' },
  { id: 'paper_citations', label: 'Paper Citations' },
  { id: 'paper_downloads', label: 'Paper Downloads' },
];

// view id corresponds to graph data's value
const viewIdToValueKey: { [view in View]: string } = {
  author_occurrences: 'size',
  paper_citations: 'citation_count',
  paper_downloads: 'read_count',
};

export const AuthorNetworkPageContainer = ({ query }: IAuthorNetworkPageContainerProps): ReactElement => {
  // fetch bibcodes of query
  const {
    data: bibsQueryResponse,
    isLoading: bibsQueryIsLoading,
    isError: bibsQueryIsError,
    error: bibsQueryError,
  } = useSearch({ ...query, fl: ['bibcode'], rows: 400 }, { enabled: !!query && !!query.q && query.q.length > 0 });

  // tranform query data to a list of bibcodes
  const bibcodes = useMemo(() => {
    if (bibsQueryResponse) {
      return bibsQueryResponse.docs.map((d) => d.bibcode);
    } else {
      return [];
    }
  }, [bibsQueryResponse]);

  // fetch author network data when bibcodes are available
  const {
    data: authorNetworkData,
    isLoading: authorNetworkIsLoading,
    isError: authorNetworkIsError,
    error: authorNetworkError,
  } = useGetAuthorNetwork(bibcodes, { enabled: bibcodes && bibcodes.length > 0 });

  const [currentViewId, setCurrentViewId] = useState<View>(views[0].id);

  // author network data to network graph
  const authorNetworkGraph: ISunburstGraph = useMemo(() => {
    if (authorNetworkData) {
      return getAuthorNetworkGraph(authorNetworkData, viewIdToValueKey[currentViewId]);
    }
  }, [authorNetworkData, currentViewId]);

  const handleViewChange = (viewId: string) => {
    setCurrentViewId(viewId as View);
  };

  return (
    <Box as="section" aria-label="Author network graph" my={10}>
      {bibsQueryIsLoading && (
        <>
          <Text>Fetching records</Text>
          <CircularProgress isIndeterminate />
        </>
      )}
      {authorNetworkIsLoading && (
        <>
          <Text>Fetching author network data</Text>
          <CircularProgress isIndeterminate />
        </>
      )}
      {!authorNetworkIsLoading && authorNetworkGraph && (
        <>
          {authorNetworkGraph.error ? (
            <Flex justifyContent="center">
              <Alert
                status="info"
                variant="subtle"
                flexDirection="column"
                justifyContent="center"
                height="200px"
                backgroundColor="transparent"
                my={5}
                width="50%"
              >
                <AlertIcon boxSize="40px" mr={0} />
                <AlertTitle mt={4} mb={1} fontSize="lg">
                  Cannot generate network
                </AlertTitle>
                <AlertDescription>
                  The network grouping algorithm could not generate group data for your network. This might be because
                  the list of papers was too small or sparse to produce multiple meaningful groups.
                </AlertDescription>
              </Alert>
            </Flex>
          ) : (
            <NetworkGraphPane
              graph={authorNetworkGraph}
              views={views}
              onChangeView={handleViewChange}
              defaultView={views[0].id}
            />
          )}
        </>
      )}
    </Box>
  );
};

// From author network data, create graph data
const getAuthorNetworkGraph = (response: IADSApiVisResponse, valueKey: string): ISunburstGraph => {
  if (!response['data']['root']) {
    return { data: undefined, error: new Error('Cannot generate network') };
  }
  return { data: response['data']['root'], idKey: 'name', valueKey: valueKey };
};
