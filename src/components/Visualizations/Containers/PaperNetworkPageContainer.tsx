import { IADSApiSearchParams, useSearch, useVaultBigQuerySearch } from '@api';
import { IADSApiPaperNetworkFullGraph, IADSApiPaperNetworkSummaryGraphNode } from '@api/vis/types';
import { useGetPaperNetwork } from '@api/vis/vis';
import { Box, Button, SimpleGrid, Stack, Text, useToast } from '@chakra-ui/react';
import {
  Expandable,
  SimpleLink,
  StandardAlertMessage,
  LoadingMessage,
  CustomInfoMessage,
  IPaperNetworkLinkDetails,
  IPaperNetworkNodeDetails,
  PaperNetworkDetailsPane,
  PaperNetworkGraphPane,
} from '@components';
import { ITagItem, Tags } from '@components';
import { makeSearchParams } from '@utils';
import axios from 'axios';
import { useRouter } from 'next/router';
import { flatten, intersection, pluck, prop, sortBy, uniq } from 'ramda';
import { ReactElement, Reducer, useEffect, useMemo, useReducer, useState } from 'react';
import { IView } from '../GraphPanes/types';
import { ILineGraph } from '../types';
import { getPaperNetworkSummaryGraph } from '../utils';
import { NotEnoughData } from '../Widgets';

interface IPaperNetworkPageContainerProps {
  query: IADSApiSearchParams;
}

const DEFAULT_ROWS_TO_FETCH = 400;

const MAX_ROWS_TO_FETCH = 1000;

// views and corresponding graph value to use
const views: IView[] = [
  { id: 'number_papers', label: 'Number of Papers', valueToUse: 'paper_count' },
  { id: 'paper_citations', label: 'Paper Citations', valueToUse: 'total_citations' },
  { id: 'paper_downloads', label: 'Paper Downloads', valueToUse: 'total_reads' },
];

interface IPaperNetworkPageState {
  rowsToFetch: number;
  selectedNode: IPaperNetworkNodeDetails; // User selected graph node (group)
  selectedLink: IPaperNetworkLinkDetails; // use selected graph link
  filters: IPaperNetworkNodeDetails[]; // Selected filters (groups)
}

type PaperNetworkPageAction =
  | { type: 'CHANGE_PAPER_LIMIT'; payload: number }
  | {
      type: 'SET_SELECTED_NODE';
      payload: { node: IADSApiPaperNetworkSummaryGraphNode; fullGraph: IADSApiPaperNetworkFullGraph };
    }
  | {
      type: 'SET_SELECTED_LINK';
      payload: {
        source: IADSApiPaperNetworkSummaryGraphNode;
        sourceColor: string;
        target: IADSApiPaperNetworkSummaryGraphNode;
        targetColor: string;
        fullGraph: IADSApiPaperNetworkFullGraph;
      };
    }
  | { type: 'ADD_FILTER'; payload: IPaperNetworkNodeDetails }
  | { type: 'REMOVE_FILTER'; payload: IPaperNetworkNodeDetails }
  | { type: 'REMOVE_FILTER_TAG'; payload: ITagItem }
  | { type: 'CLEAR_FILTERS' };

export const PaperNetworkPageContainer = ({ query }: IPaperNetworkPageContainerProps): ReactElement => {
  const router = useRouter();

  const toast = useToast();

  const reducer: Reducer<IPaperNetworkPageState, PaperNetworkPageAction> = (state, action) => {
    switch (action.type) {
      case 'CHANGE_PAPER_LIMIT':
        return { ...state, selectedLink: null, selectedNode: null, filters: [], rowsToFetch: action.payload };
      case 'SET_SELECTED_NODE':
        return {
          ...state,
          selectedLink: null,
          selectedNode: getNodeDetails(action.payload.node, action.payload.fullGraph),
        };
      case 'SET_SELECTED_LINK':
        return {
          ...state,
          selectedNode: null,
          selectedLink: getLinkDetails(
            action.payload.source,
            action.payload.sourceColor,
            action.payload.target,
            action.payload.targetColor,
            action.payload.fullGraph,
          ),
        };
      case 'ADD_FILTER':
        return { ...state, filters: uniq([...state.filters, action.payload]) };
      case 'REMOVE_FILTER':
        return { ...state, filters: state.filters.filter((f) => f.node_name !== action.payload.node_name) };
      case 'REMOVE_FILTER_TAG':
        return { ...state, filters: state.filters.filter((filter) => filter.id !== action.payload.id) };
      case 'CLEAR_FILTERS':
        return { ...state, filters: [] };
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(reducer, {
    rowsToFetch: DEFAULT_ROWS_TO_FETCH,
    selectedNode: null,
    selectedLink: null,
    filters: [],
  });

  // fetch bibcodes of query
  const {
    data: bibsQueryResponse,
    isLoading: bibsQueryIsLoading,
    isError: bibsQueryIsError,
    error: bibsQueryError,
  } = useSearch(
    { ...query, fl: ['bibcode'], rows: state.rowsToFetch },
    { enabled: !!query && !!query.q && query.q.length > 0 },
  );

  // tranform query data to a list of bibcodes
  const bibcodes = useMemo(() => {
    return bibsQueryResponse ? bibsQueryResponse.docs.map((d) => d.bibcode) : [];
  }, [bibsQueryResponse]);

  const numFound = useMemo(() => {
    return bibsQueryResponse ? bibsQueryResponse.numFound : 0;
  }, [bibsQueryResponse]);

  // fetch paper network data when bibcodes are available
  const {
    data: paperNetworkData,
    isLoading: paperNetworkIsLoading,
    isSuccess: paperNetworkIsSuccess,
    isError: paperNetworkIsError,
    error: paperNetworkError,
  } = useGetPaperNetwork(bibcodes, { enabled: bibcodes && bibcodes.length > 0 });

  // paper network data to summary graph
  const paperNetworkSummaryGraph: ILineGraph = useMemo(() => {
    if (paperNetworkData?.data?.summaryGraph) {
      return getPaperNetworkSummaryGraph(paperNetworkData);
    }
  }, [paperNetworkData]);

  // convert filters to tags
  const filterTagItems: ITagItem[] = useMemo(() => {
    return state.filters.map((node) => ({
      id: node.id,
      label: `Group ${node.node_name}`,
    }));
  }, [state.filters]);

  // when filtered search is applied, trigger big query
  const [applyingBibcodes, setApplyingBibcodes] = useState<string[]>([]);
  const { data: bigQueryData, error: bigQueryError } = useVaultBigQuerySearch(applyingBibcodes, {
    enabled: applyingBibcodes.length > 0,
  });

  useEffect(() => {
    if (numFound && numFound < state.rowsToFetch) {
      dispatch({ type: 'CHANGE_PAPER_LIMIT', payload: numFound });
    }
  }, [numFound]);

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

  // get all papers (bibcodes) of the filter groups and trigger big query search
  const handleApplyFilters = () => {
    const bibcodes = uniq(
      state.filters.reduce(
        (acc, node) => [...acc, ...node.allPapers.reduce((acc1, paper) => [...acc1, paper.node_name], [] as string[])],
        [] as string[],
      ), // filters to a list of papers
    );

    // This will trigger big query and redirect
    setApplyingBibcodes(bibcodes);
  };

  return (
    <Box as="section" aria-label="Paper network graph" my={10}>
      <StatusDisplay
        bibsQueryIsError={bibsQueryIsError}
        paperNetworkIsError={paperNetworkIsError}
        bibsQueryIsLoading={bibsQueryIsLoading}
        bibsQueryError={bibsQueryError}
        paperNetworkIsLoading={paperNetworkIsLoading}
        paperNetworkError={paperNetworkError}
      />
      {!paperNetworkIsLoading && paperNetworkIsSuccess && !paperNetworkData.data?.summaryGraph && (
        <CustomInfoMessage status="info" title="Could not generate" description={<NotEnoughData />} />
      )}
      {!paperNetworkIsLoading && paperNetworkIsSuccess && paperNetworkData.data?.summaryGraph && (
        <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={16}>
          <Box>
            <Expandable
              title="About Paper Network"
              description={
                <>
                  This network visualization represents groups of papers from your result set which cite similar papers.
                  Click on a group to learn more about the papers within the group, as well as the papers cited by those
                  papers.
                  <SimpleLink href="/help/actions/visualize#paper-network" newTab>
                    Learn more about paper network
                  </SimpleLink>
                </>
              }
            />
            <PaperNetworkGraphPane
              nodesData={paperNetworkData.data.summaryGraph.nodes}
              linksData={paperNetworkData.data.summaryGraph.links}
              views={views}
              onClickNode={(node) =>
                dispatch({ type: 'SET_SELECTED_NODE', payload: { node, fullGraph: paperNetworkData.data.fullGraph } })
              }
              onClickLink={(source, sourceColor, target, targetColor) =>
                dispatch({
                  type: 'SET_SELECTED_LINK',
                  payload: { source, sourceColor, target, targetColor, fullGraph: paperNetworkData.data.fullGraph },
                })
              }
              onChangePaperLimit={(limit) => dispatch({ type: 'CHANGE_PAPER_LIMIT', payload: limit })}
              paperLimit={state.rowsToFetch}
              maxPaperLimit={Math.min(numFound, MAX_ROWS_TO_FETCH)}
            />
          </Box>
          <Box>
            <FilterSearchBar
              tagItems={filterTagItems}
              onRemove={(tag) => dispatch({ type: 'REMOVE_FILTER_TAG', payload: tag })}
              onClear={() => dispatch({ type: 'CLEAR_FILTERS' })}
              onApply={handleApplyFilters}
            />
            <PaperNetworkDetailsPane
              summaryGraph={paperNetworkSummaryGraph}
              node={state.selectedNode}
              link={state.selectedLink}
              onAddToFilter={(node) => dispatch({ type: 'ADD_FILTER', payload: node })}
              onRemoveFromFilter={(node) => dispatch({ type: 'REMOVE_FILTER', payload: node })}
              canAddAsFilter={
                state.selectedNode && state.filters.findIndex((f) => f.id === state.selectedNode.id) === -1
              }
            />
          </Box>
        </SimpleGrid>
      )}
    </Box>
  );
};

const StatusDisplay = ({
  bibsQueryIsError,
  paperNetworkIsError,
  bibsQueryIsLoading,
  bibsQueryError,
  paperNetworkIsLoading,
  paperNetworkError,
}: {
  bibsQueryIsError: boolean;
  paperNetworkIsError: boolean;
  bibsQueryIsLoading: boolean;
  bibsQueryError: unknown;
  paperNetworkIsLoading: boolean;
  paperNetworkError: unknown;
}): ReactElement => {
  return (
    <>
      {bibsQueryIsError && (
        <StandardAlertMessage
          status="error"
          title="Error fetching records!"
          description={axios.isAxiosError(bibsQueryError) && bibsQueryError.message}
        />
      )}
      {paperNetworkIsError && (
        <StandardAlertMessage
          status="error"
          title="Error fetching paper network data!"
          description={axios.isAxiosError(paperNetworkError) && paperNetworkError.message}
        />
      )}
      {bibsQueryIsLoading && <LoadingMessage message="Fetching records" />}
      {paperNetworkIsLoading && <LoadingMessage message="Fetching paper network data" />}
    </>
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
      <Text>Narrow down your search results to papers from a certain group</Text>
      <Tags
        tagItems={tagItems}
        onRemove={onRemove}
        onClear={onClear}
        placeHolder="select a group in the visualization and click the 'add to filter' button"
        flex={1}
      />
      <Button onClick={onApply}>Search</Button>
    </Stack>
  );
};

// Get individual node details
const getNodeDetails = (
  node: IADSApiPaperNetworkSummaryGraphNode,
  fullGraph: IADSApiPaperNetworkFullGraph,
): IPaperNetworkNodeDetails => {
  // make a copy
  const titleWords = Object.keys(node.node_label);

  const filteredNodes = fullGraph.nodes.filter((n) => n.group === node.id);
  const groupBibs = pluck('node_name', filteredNodes);

  const topCommonReferences = Object.entries(node.top_common_references)
    .map(([k, v]) => ({
      bibcode: k,
      percent: (v * 100).toFixed(0),
      inGroup: groupBibs.findIndex((b) => b === k) !== -1,
    }))
    .sort((a, b) => parseInt(b.percent) - parseInt(a.percent));

  const allPapers = sortBy(prop('citation_count'), filteredNodes).reverse();

  return { ...node, titleWords, allPapers, topCommonReferences };
};

const getAllLinks = (id: number, fullGraph: IADSApiPaperNetworkFullGraph) => {
  const indexes: number[] = [];
  const links: IADSApiPaperNetworkFullGraph['links'] = [];

  fullGraph.nodes.forEach((n, i) => {
    if (n.group === id) {
      indexes.push(i);
    }
  });
  fullGraph.links.forEach((l) => {
    if (indexes.indexOf(l.source) !== -1 || indexes.indexOf(l.target) !== -1) {
      links.push(l);
    }
  });
  return links;
};

// get link details
const getLinkDetails = (
  source: IADSApiPaperNetworkSummaryGraphNode,
  sourceColor: string,
  target: IADSApiPaperNetworkSummaryGraphNode,
  targetColor: string,
  fullGraph: IADSApiPaperNetworkFullGraph,
): IPaperNetworkLinkDetails => {
  // find references in common

  const links1 = getAllLinks(source.id, fullGraph);
  const links2 = getAllLinks(target.id, fullGraph);

  const allReferences1 = flatten(pluck('overlap', links1));
  const allReferences2 = flatten(pluck('overlap', links2));

  // shared references
  const references: IPaperNetworkLinkDetails['papers'] = [];
  intersection(allReferences1, allReferences2).forEach((b) => {
    const percent1 = allReferences1.filter((b1) => b1 === b).length / allReferences1.length;
    const percent2 = allReferences2.filter((b1) => b1 === b).length / allReferences2.length;
    references.push({ bibcode: b, percent1: percent1 * 100, percent2: percent2 * 100 });
  });

  references.sort((a, b) => b.percent1 * b.percent2 - a.percent1 * a.percent2);

  return {
    groupOne: { name: `Group ${source.node_name}`, color: sourceColor },
    groupTwo: { name: `Group ${target.node_name}`, color: targetColor },
    papers: references,
  };
};
