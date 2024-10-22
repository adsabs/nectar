import { IADSApiPaperNetworkFullGraph, IADSApiPaperNetworkSummaryGraphNode } from '@/api/vis/types';
import { useGetPaperNetwork } from '@/api/vis/vis';
import { Box, Center, SimpleGrid, useBreakpointValue, useToast } from '@chakra-ui/react';

import { setFQ } from '@/query-utils';
import axios from 'axios';
import { useRouter } from 'next/router';
import { sort, uniq } from 'ramda';
import { ReactElement, Reducer, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { IView } from '../GraphPanes/types';
import { ILineGraph } from '../types';
import { getPaperNetworkLinkDetails, getPaperNetworkNodeDetails, getPaperNetworkSummaryGraph } from '../utils';
import { FilterSearchBar, IFilterSearchBarProps, NotEnoughData } from '../Widgets';
import {
  IPaperNetworkLinkDetails,
  IPaperNetworkNodeDetails,
  PaperNetworkDetailsPane,
  PaperNetworkGraphPane,
} from '@/components/Visualizations';
import { ITagItem } from '@/components/Tags';
import { CustomInfoMessage, LoadingMessage, StandardAlertMessage } from '@/components/Feedbacks';
import { Expandable } from '@/components/Expandable';
import { SimpleLink } from '@/components/SimpleLink';
import { DataDownloader } from '@/components/DataDownloader';
import { makeSearchParams } from '@/utils/common/search';
import { IADSApiSearchParams } from '@/api/search/types';
import { useVaultBigQuerySearch } from '@/api/vault/vault';

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

const reducer: Reducer<IPaperNetworkPageState, PaperNetworkPageAction> = (state, action) => {
  switch (action.type) {
    case 'CHANGE_PAPER_LIMIT':
      return { ...state, selectedLink: null, selectedNode: null, filters: [], rowsToFetch: action.payload };
    case 'SET_SELECTED_NODE':
      return {
        ...state,
        selectedLink: null,
        selectedNode: getPaperNetworkNodeDetails(action.payload.node, action.payload.fullGraph),
      };
    case 'SET_SELECTED_LINK':
      return {
        ...state,
        selectedNode: null,
        selectedLink: getPaperNetworkLinkDetails(
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

export const PaperNetworkPageContainer = ({ query }: IPaperNetworkPageContainerProps): ReactElement => {
  const router = useRouter();

  const toast = useToast();

  // number of columns for the page layout
  const columns = useBreakpointValue({ base: 1, xl: 2 });

  // filter search bar layout, use column when width is small
  const filterSearchDirection: IFilterSearchBarProps['direction'] = useBreakpointValue({
    base: 'column',
    md: 'row',
    xl: 'column',
  });

  const [state, dispatch] = useReducer(reducer, {
    rowsToFetch: DEFAULT_ROWS_TO_FETCH,
    selectedNode: null,
    selectedLink: null,
    filters: [],
  });

  // fetch paper network data
  const {
    data: paperNetworkData,
    isLoading: paperNetworkIsLoading,
    isSuccess: paperNetworkIsSuccess,
    isError: paperNetworkIsError,
    error: paperNetworkError,
  } = useGetPaperNetwork(
    { ...query, rows: state.rowsToFetch },
    { enabled: !!query && !!query.q && query.q.length > 0 },
  );

  const numFound = useMemo(() => {
    return paperNetworkData ? paperNetworkData.msg.numFound : 0;
  }, [paperNetworkData]);

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
      const q = setFQ('selection', `docs(${bigQueryData.qid})`, query);
      const search = makeSearchParams(q);
      void router.push({ pathname: '/search', search });
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
  }, [bigQueryData, bigQueryError]);

  // get all papers (bibcodes) of the filter groups and trigger big query search
  const handleApplyFilters = () => {
    const bibcodes = uniq(
      state.filters.reduce(
        (acc, node) => [...acc, ...node.papers.reduce((acc1, paper) => [...acc1, paper.bibcode], [] as string[])],
        [] as string[],
      ), // filters to a list of papers
    );

    // This will trigger big query and redirect
    setApplyingBibcodes(bibcodes);
  };

  const getCSVDataContent = useCallback(() => {
    const sortedNodes = sort((e1, e2) => {
      if (e1.node_name === e2.node_name) {
        return 0;
      }
      return e1.node_name < e2.node_name ? -1 : 1;
    }, paperNetworkData.data.summaryGraph.nodes);

    let output = 'group,label,paper_count,top_references,citations,download count\n';
    sortedNodes.forEach((row) => {
      output += `"${row.node_name}","${Object.keys(row.node_label).join(',')}","${row.paper_count}","${Object.keys(
        row.top_common_references,
      ).join(',')}","${row.total_citations}","${row.total_reads}"\n`;
    });

    return output;
  }, [paperNetworkData?.data?.summaryGraph?.nodes]);

  return (
    <Box as="section" aria-label="Paper network graph" my={10}>
      <StatusDisplay
        paperNetworkIsError={paperNetworkIsError}
        paperNetworkIsLoading={paperNetworkIsLoading}
        paperNetworkError={paperNetworkError}
      />
      {!paperNetworkIsLoading && paperNetworkIsSuccess && !paperNetworkData.data?.summaryGraph && (
        <CustomInfoMessage status="info" title="Could not generate" description={<NotEnoughData />} />
      )}
      {!paperNetworkIsLoading && paperNetworkIsSuccess && paperNetworkData.data?.summaryGraph && (
        <SimpleGrid columns={columns} spacing={16}>
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
            {paperNetworkData?.data?.summaryGraph?.nodes && (
              <DataDownloader
                label="Download CSV Data"
                getFileContent={() => getCSVDataContent()}
                fileName="paper-network.csv"
              />
            )}
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
              description="Narrow down your search results to papers from a certain group"
              placeHolder="select a group in the visualization and click the 'add to filter' button"
              direction={filterSearchDirection}
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
  paperNetworkIsError,
  paperNetworkIsLoading,
  paperNetworkError,
}: {
  paperNetworkIsError: boolean;
  paperNetworkIsLoading: boolean;
  paperNetworkError: unknown;
}): ReactElement => {
  return (
    <>
      {paperNetworkIsError && (
        <StandardAlertMessage
          status="error"
          title="Error fetching paper network data!"
          description={axios.isAxiosError(paperNetworkError) && paperNetworkError.message}
        />
      )}
      {paperNetworkIsLoading && (
        <Center>
          <LoadingMessage message="Fetching paper network data" />
        </Center>
      )}
    </>
  );
};
