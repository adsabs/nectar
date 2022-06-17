import { IADSApiSearchParams, useSearch } from '@api';
import { IADSApiVisResponse, IBibcodeDict, ILeaf } from '@api/vis/types';
import { useGetAuthorNetwork } from '@api/vis/vis';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@chakra-ui/alert';
import { Box, CircularProgress, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { INodeDetails, NetworkDetailsPane } from '@components';
import axios from 'axios';
import { decode } from 'he';
import { countBy, sortBy } from 'ramda';
import { ReactElement, useMemo, useState } from 'react';
import { NetworkGraphPane } from '../GraphPanes';
import { ISunburstGraph, SunburstNode } from '../types';

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

  const [selected, setSelected] = useState<INodeDetails>(null);

  // author network data to network graph
  const authorNetworkGraph: ISunburstGraph = useMemo(() => {
    if (authorNetworkData) {
      return getAuthorNetworkGraph(authorNetworkData, viewIdToValueKey[currentViewId]);
    }
  }, [authorNetworkData, currentViewId]);

  const handleViewChange = (viewId: string) => {
    setCurrentViewId(viewId as View);
  };

  const handleGraphNodeClick = (node: SunburstNode) => {
    const bibcode_dict = authorNetworkData.data.bibcode_dict;
    setSelected(getNodeDetails(node, bibcode_dict));
  };

  return (
    <Box as="section" aria-label="Author network graph" my={10}>
      {bibsQueryIsError && (
        <Alert status="error" my={5}>
          <AlertIcon />
          <AlertTitle mr={2}>Error fetching records!</AlertTitle>
          <AlertDescription>{axios.isAxiosError(bibsQueryError) && bibsQueryError.message}</AlertDescription>
        </Alert>
      )}
      {authorNetworkIsError && (
        <Alert status="error" my={5}>
          <AlertIcon />
          <AlertTitle mr={2}>Error fetching author network data!</AlertTitle>
          <AlertDescription>{axios.isAxiosError(authorNetworkError) && authorNetworkError.message}</AlertDescription>
        </Alert>
      )}
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
            <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={10}>
              <NetworkGraphPane
                graph={authorNetworkGraph}
                views={views}
                onChangeView={handleViewChange}
                defaultView={views[0].id}
                onClickNode={handleGraphNodeClick}
              />
              <NetworkDetailsPane node={selected} />
            </SimpleGrid>
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

// Get individual node details
const getNodeDetails = (node: SunburstNode, bibcode_dict: IBibcodeDict): INodeDetails => {
  // if selected an author node
  if (!('children' in node)) {
    const authorNode = node as ILeaf;

    const bibcodes = authorNode.papers;

    // get author's papers details
    const papers = bibcodes.map((bibcode) => ({
      ...bibcode_dict[bibcode],
      bibcode,
      title: Array.isArray(bibcode_dict[bibcode].title)
        ? decode(bibcode_dict[bibcode].title[0])
        : decode(bibcode_dict[bibcode].title as string),
    }));

    // sort by citation count
    papers.sort((p1, p2) => {
      return p1.citation_count - p2.citation_count;
    });

    // most recent year
    const mostRecentYear = bibcodes
      .sort((b1, b2) => {
        return parseInt(b1.slice(0, 4)) - parseInt(b2.slice(0, 4));
      })
      [bibcodes.length - 1].slice(0, 4);

    return { name: authorNode.name, type: 'author', papers, mostRecentYear };
  }
  // if selected a group node
  else {
    // all bibcodes in this group, has duplicates
    const allBibcodes = node.children.reduce(
      (prev, current) => [...prev, ...(current as ILeaf).papers],
      [] as string[],
    );

    // bibcode: author count
    const authorCount = countBy((a) => a, allBibcodes);

    // all bibcodes w/o duplicates
    const bibcodes = Object.keys(authorCount);

    // get min and max authors
    const numAuthors = Object.values(authorCount).sort();
    const minNumAuthors = numAuthors[0];
    const maxNumAuthors = numAuthors[numAuthors.length - 1];

    // min max percent authors in the group
    const percentAuthors = Object.entries(authorCount)
      .map(([bibcode, aCount]) => aCount / bibcode_dict[bibcode].authors.length)
      .sort();
    const minPercentAuthors = percentAuthors[0];
    const maxPercentAuthors = percentAuthors[percentAuthors.length - 1];

    // min max citations
    const numCitations = bibcodes
      .map((bibcode) => bibcode_dict[bibcode].citation_count / bibcode_dict[bibcode].authors.length)
      .sort();
    const minNumCitations = numCitations[0];
    const maxNumCitations = numCitations[numCitations.length - 1];

    // most recent year
    const mostRecentYear = bibcodes
      .sort((b1, b2) => {
        return parseInt(b1.slice(0, 4)) - parseInt(b2.slice(0, 4));
      })
      [bibcodes.length - 1].slice(0, 4);

    let papers = bibcodes.map((bibcode) => ({
      ...bibcode_dict[bibcode],
      bibcode,
      title: Array.isArray(bibcode_dict[bibcode].title)
        ? decode(bibcode_dict[bibcode].title[0])
        : decode(bibcode_dict[bibcode].title as string),
      groupAuthorCount: authorCount[bibcode],
    }));

    // sort paper
    papers = sortBy(({ bibcode }) => {
      return (
        (((((authorCount[bibcode] - minNumAuthors) / (maxNumAuthors - minNumAuthors)) *
          (authorCount[bibcode] / bibcode_dict[bibcode].authors.length - minPercentAuthors)) /
          (maxPercentAuthors - minPercentAuthors)) *
          (bibcode_dict[bibcode].citation_count / bibcode_dict[bibcode].authors.length - minNumCitations)) /
        (maxNumCitations - minNumCitations)
      );
    }, papers);

    return { name: `Group ${node.name as string}`, type: 'group', papers, mostRecentYear };
  }
};
