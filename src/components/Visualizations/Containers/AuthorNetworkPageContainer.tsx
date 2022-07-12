import { IADSApiSearchParams, useSearch, useVaultBigQuerySearch } from '@api';
import { IADSApiVisResponse, IBibcodeDict, ILeaf } from '@api/vis/types';
import { useGetAuthorNetwork } from '@api/vis/vis';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@chakra-ui/alert';
import { Box, Button, CircularProgress, SimpleGrid, Stack, Text, useToast } from '@chakra-ui/react';
import { INodeDetails, NetworkDetailsPane, CustomInfoMessage, Expandable, SimpleLink } from '@components';
import { ITagItem, Tags } from '@components/Tags';
import { Serie } from '@nivo/line';
import { makeSearchParams } from '@utils';
import axios from 'axios';
import { decode } from 'he';
import { useRouter } from 'next/router';
import { countBy, reduce, sortBy, uniq } from 'ramda';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import { NetworkGraphPane } from '../GraphPanes';
import { ILineGraph, ISunburstGraph, SunburstNode } from '../types';

interface IAuthorNetworkPageContainerProps {
  query: IADSApiSearchParams;
}

type View = 'author_occurrences' | 'paper_citations' | 'paper_downloads';

const DEFAULT_ROWS_TO_FETCH = 400;

const MAX_ROWS_TO_FETCH = 1000;

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
  const router = useRouter();
  const toast = useToast();

  const [rowsToFetch, setRowsToFetch] = useState(DEFAULT_ROWS_TO_FETCH);

  // fetch bibcodes of query
  const {
    data: bibsQueryResponse,
    isLoading: bibsQueryIsLoading,
    isError: bibsQueryIsError,
    error: bibsQueryError,
  } = useSearch(
    { ...query, fl: ['bibcode'], rows: rowsToFetch },
    { enabled: !!query && !!query.q && query.q.length > 0 },
  );

  // tranform query data to a list of bibcodes
  const bibcodes = useMemo(() => {
    if (bibsQueryResponse) {
      return bibsQueryResponse.docs.map((d) => d.bibcode);
    } else {
      return [];
    }
  }, [bibsQueryResponse]);

  const numFound = useMemo(() => {
    if (bibsQueryResponse) {
      return bibsQueryResponse.numFound;
    } else {
      return 0;
    }
  }, [bibsQueryResponse]);

  // fetch author network data when bibcodes are available
  const {
    data: authorNetworkData,
    isLoading: authorNetworkIsLoading,
    isError: authorNetworkIsError,
    error: authorNetworkError,
  } = useGetAuthorNetwork(bibcodes, { enabled: bibcodes && bibcodes.length > 0 });

  // Type of view
  const [currentViewId, setCurrentViewId] = useState<View>(views[0].id);

  // User selected graph node (group, author)
  const [selected, setSelected] = useState<INodeDetails>(null);

  // Selected filters (group, author)
  const [filters, setFilters] = useState<INodeDetails[]>([]);

  // author network data to network graph
  const authorNetworkGraph: ISunburstGraph = useMemo(() => {
    if (authorNetworkData) {
      return getAuthorNetworkGraph(authorNetworkData, viewIdToValueKey[currentViewId]);
    }
  }, [authorNetworkData, currentViewId]);

  // author network data to summary graph
  const authorNetworkSummaryGraph: ILineGraph = useMemo(() => {
    if (authorNetworkData) {
      return getAuthorNetworkSummaryGraph(authorNetworkData);
    }
  }, [authorNetworkData]);

  // convert filters to tags
  const filterTagItems: ITagItem[] = useMemo(() => {
    return filters.map((node) => ({
      id: node.name,
      label: node.name,
    }));
  }, [filters]);

  // when filtered search is applied, trigger big query
  const [applyingBibcodes, setApplyingBibcodes] = useState<string[]>([]);
  const { data: bigQueryData, error: bigQueryError } = useVaultBigQuerySearch(applyingBibcodes, {
    enabled: applyingBibcodes.length > 0,
  });

  // When big query data is fetched, redirect to the search results page
  useEffect(() => {
    if (bigQueryData && applyingBibcodes.length > 0) {
      void router.push({ pathname: '/search', search: makeSearchParams({ q: `docs(${bigQueryData.qid})` }) });
      setApplyingBibcodes([]);
    }

    if (bigQueryError) {
      toast({
        status: 'error',
        title: 'Error!',
        description: 'Error fetching filtered results',
      });
      setApplyingBibcodes([]);
    }
  }, [bigQueryData, bigQueryError, applyingBibcodes]);

  // Callback Handlers

  const handleViewChange = (viewId: string) => {
    setCurrentViewId(viewId as View);
  };

  const handleGraphNodeClick = (node: SunburstNode) => {
    const bibcode_dict = authorNetworkData.data.bibcode_dict;
    setSelected(getNodeDetails(node, bibcode_dict));
  };

  const handleAddFilter = (node: INodeDetails) => {
    setFilters(uniq([...filters, node]));
  };

  const handleRemoveFilter = (node: INodeDetails) => {
    setFilters(filters.filter((f) => f.name !== node.name));
  };

  const handleRemoveFilterTag = (filterTagItem: ITagItem) => {
    setFilters(filters.filter((filter) => filter.name !== filterTagItem.id));
  };

  const handleClearFiltersTags = () => {
    setFilters([]);
  };

  const handleChangePaperLimit = (limit: number) => {
    if (limit <= MAX_ROWS_TO_FETCH) {
      setRowsToFetch(limit);
    }
  };

  // get all papers (bibcodes) of the filter groups and authors and trigger big query search
  const handleApplyFilters = () => {
    const bibcodes = uniq(
      filters.reduce(
        (acc, node) => [...acc, ...node.papers.reduce((acc1, paper) => [...acc1, paper.bibcode], [] as string[])],
        [] as string[],
      ),
    );

    // This will trigger big query and redirect
    setApplyingBibcodes(bibcodes);
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
            <CustomInfoMessage
              status={'info'}
              title="Cannot generate network"
              description="The network grouping algorithm could not generate group data for your network. This might be because
            the list of papers was too small or sparse to produce multiple meaningful groups."
            />
          ) : (
            <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={16}>
              <Box>
                <Expandable
                  title="About Author Network"
                  description={
                    <>
                      This network visualization finds groups of authors within your search results. You can click on
                      the segments to view the papers connected with a group or a particular author.
                      <SimpleLink href="/help/actions/visualize#author-network" newTab>
                        Learn more about author network
                      </SimpleLink>
                    </>
                  }
                />
                <NetworkGraphPane
                  graph={authorNetworkGraph}
                  views={views}
                  onChangeView={handleViewChange}
                  defaultView={views[0].id}
                  onClickNode={handleGraphNodeClick}
                  onChagePaperLimit={handleChangePaperLimit}
                  paperLimit={rowsToFetch}
                  maxPaperLimit={Math.min(numFound, MAX_ROWS_TO_FETCH)}
                />
              </Box>
              <Box>
                <FilterSearchBar
                  tagItems={filterTagItems}
                  onRemove={handleRemoveFilterTag}
                  onClear={handleClearFiltersTags}
                  onApply={handleApplyFilters}
                />
                <NetworkDetailsPane
                  summaryGraph={authorNetworkSummaryGraph}
                  node={selected}
                  onAddToFilter={handleAddFilter}
                  onRemoveFromFilter={handleRemoveFilter}
                  canAddAsFilter={filters.findIndex((f) => f.name === selected.name) === -1}
                />
              </Box>
            </SimpleGrid>
          )}
        </>
      )}
    </Box>
  );
};

const FilterSearchBar = ({
  tagItems,
  onRemove,
  onClear,
  onApply,
}: {
  tagItems: ITagItem[];
  onRemove: (tagItem: ITagItem) => void;
  onClear: () => void;
  onApply: () => void;
}): ReactElement => {
  return (
    <Stack direction="column" mb={10}>
      <Text fontWeight="bold">Filter current search: </Text>
      <Text>Narrow down your search results to papers from a certain group or author</Text>
      <Tags
        tagItems={tagItems}
        onRemove={onRemove}
        onClear={onClear}
        placeHolder="select an author or a group in the visualization and click the 'add to filter' button"
        flex={1}
      />
      <Button onClick={onApply}>Search</Button>
    </Stack>
  );
};

// From author network data, create graph data
const getAuthorNetworkGraph = (response: IADSApiVisResponse, valueKey: string): ISunburstGraph => {
  if (!response['data']['root']) {
    return { data: undefined, error: new Error('Cannot generate network') };
  }
  return { data: response['data']['root'], idKey: 'name', valueKey: valueKey };
};

// Summary graph
const getAuthorNetworkSummaryGraph = (response: IADSApiVisResponse): ILineGraph => {
  if (!response.data.root) {
    return { data: undefined, error: new Error('Cannot generate network') };
  }

  const data: Serie[] = [];

  response.data.root.children.forEach((group, index) => {
    if (index > 6) {
      return;
    }

    // all papers in this group
    // into year and paper count [ ... {year: count} ]
    const yearPaperCount = countBy(
      (bibcode) => bibcode.slice(0, 4),
      uniq(reduce((acc, author) => [...acc, ...author.papers], [] as string[], group.children)),
    );

    // convert graph data to [ ... {x: year, y: count} ]
    const graphData = Object.entries(yearPaperCount).map(([year, count]) => ({ x: parseInt(year), y: count }));

    data.push({ id: group.name, data: graphData });
  });

  console.log(data);
  return { data };
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
