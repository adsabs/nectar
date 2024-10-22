import { IADSApiAuthorNetworkNode, IBibcodeDict } from '@/api/vis/types';
import { useGetAuthorNetwork } from '@/api/vis/vis';
import { Box, Center, SimpleGrid, useBreakpointValue, useToast } from '@chakra-ui/react';

import { setFQ } from '@/query-utils';
import axios from 'axios';
import { useRouter } from 'next/router';
import { uniq } from 'ramda';
import { ReactElement, Reducer, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { IView } from '../GraphPanes/types';
import { ILineGraph } from '../types';
import { getAuthorNetworkNodeDetails, getAuthorNetworkSummaryGraph } from '../utils';
import { FilterSearchBar, IFilterSearchBarProps, NotEnoughData } from '../Widgets';
import {
  AuthorNetworkDetailsPane,
  AuthorNetworkGraphPane,
  IAuthorNetworkNodeDetails,
} from '@/components/Visualizations';
import { ITagItem } from '@/components/Tags';
import { CustomInfoMessage, LoadingMessage, StandardAlertMessage } from '@/components/Feedbacks';
import { Expandable } from '@/components/Expandable';
import { SimpleLink } from '@/components/SimpleLink';
import { DataDownloader } from '@/components/DataDownloader';
import { makeSearchParams } from '@/utils/common/search';
import { IADSApiSearchParams } from '@/api/search/types';
import { useVaultBigQuerySearch } from '@/api/vault/vault';

interface IAuthorNetworkPageContainerProps {
  query: IADSApiSearchParams;
}

const DEFAULT_ROWS_TO_FETCH = 400;

const MAX_ROWS_TO_FETCH = 1000;

// views and corresponding graph value to use
const views: IView[] = [
  { id: 'author_occurrences', label: 'Author Occurrences', valueToUse: 'size' },
  { id: 'paper_citations', label: 'Paper Citations', valueToUse: 'citation_count' },
  { id: 'paper_downloads', label: 'Paper Downloads', valueToUse: 'read_count' },
];

interface IAuthorNetworkPageState {
  rowsToFetch: number;
  selected: IAuthorNetworkNodeDetails; // User selected graph node (group, author)
  filters: IAuthorNetworkNodeDetails[]; // Selected filters (group, author)
}

type AuthorNetworkPageAction =
  | { type: 'CHANGE_PAPER_LIMIT'; payload: number }
  | { type: 'SET_SELECTED'; payload: { node: IADSApiAuthorNetworkNode; dict: IBibcodeDict } }
  | { type: 'DESELECT' }
  | { type: 'ADD_FILTER'; payload: IAuthorNetworkNodeDetails }
  | { type: 'REMOVE_FILTER'; payload: IAuthorNetworkNodeDetails }
  | { type: 'REMOVE_FILTER_TAG'; payload: ITagItem }
  | { type: 'CLEAR_FILTERS' };

const reducer: Reducer<IAuthorNetworkPageState, AuthorNetworkPageAction> = (state, action) => {
  switch (action.type) {
    case 'CHANGE_PAPER_LIMIT':
      return { ...state, selected: null, filters: [], rowsToFetch: action.payload };
    case 'SET_SELECTED':
      return { ...state, selected: getAuthorNetworkNodeDetails(action.payload.node, action.payload.dict) };
    case 'DESELECT':
      return { ...state, selected: null };
    case 'ADD_FILTER':
      return { ...state, filters: uniq([...state.filters, action.payload]) };
    case 'REMOVE_FILTER':
      return { ...state, filters: state.filters.filter((f) => f.name !== action.payload.name) };
    case 'REMOVE_FILTER_TAG':
      return { ...state, filters: state.filters.filter((filter) => filter.name !== action.payload.id) };
    case 'CLEAR_FILTERS':
      return { ...state, filters: [] };
    default:
      return state;
  }
};

export const AuthorNetworkPageContainer = ({ query }: IAuthorNetworkPageContainerProps): ReactElement => {
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
    selected: null,
    filters: [],
  });

  // fetch author network data
  const {
    data: authorNetworkData,
    isLoading: authorNetworkIsLoading,
    isSuccess: authorNetworkIsSuccess,
    isError: authorNetworkIsError,
    error: authorNetworkError,
  } = useGetAuthorNetwork(
    { ...query, rows: state.rowsToFetch },
    { enabled: !!query && !!query.q && query.q.length > 0 },
  );

  const numFound = useMemo(() => {
    return authorNetworkData ? authorNetworkData.msg.numFound : 0;
  }, [authorNetworkData]);

  // author network data to summary graph
  const authorNetworkSummaryGraph: ILineGraph = useMemo(() => {
    if (authorNetworkData) {
      return getAuthorNetworkSummaryGraph(authorNetworkData);
    }
  }, [authorNetworkData]);

  // convert filters to tags
  const filterTagItems: ITagItem[] = useMemo(() => {
    return state.filters.map((node) => ({
      id: node.name,
      label: node.name,
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

  // get all papers (bibcodes) of the filter groups and authors and trigger big query search
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
    let output = 'group, author, papers, citation count, download count\n';
    authorNetworkData.data.root.children.forEach((group) => {
      const groupName = group.name as string;
      group.children.forEach((author) => {
        output += `${groupName},"${author.name as string}","${author.papers.join(',')}",${author.citation_count},${
          author.read_count
        }\n`;
      });
    });

    return output;
  }, [authorNetworkData?.data?.root?.children]);

  return (
    <Box as="section" aria-label="Author network graph" my={10}>
      <StatusDisplay
        authorNetworkIsError={authorNetworkIsError}
        authorNetworkIsLoading={authorNetworkIsLoading}
        authorNetworkError={authorNetworkError}
      />
      {!authorNetworkIsLoading && authorNetworkIsSuccess && !authorNetworkData.data?.root && (
        <CustomInfoMessage status="info" title="Could not generate" description={<NotEnoughData />} />
      )}
      {!authorNetworkIsLoading && authorNetworkIsSuccess && authorNetworkData.data?.root && (
        <SimpleGrid columns={columns} spacing={16}>
          <Box>
            <Expandable
              title="About Author Network"
              description={
                <>
                  This network visualization finds groups of authors within your search results. You can click on the
                  segments to view the papers connected with a group or a particular author.
                  <SimpleLink href="/help/actions/visualize#author-network" newTab>
                    Learn more about author network
                  </SimpleLink>
                </>
              }
            />
            {authorNetworkData?.data?.root?.children && (
              <DataDownloader
                label="Download CSV Data"
                getFileContent={() => getCSVDataContent()}
                fileName="author-network.csv"
              />
            )}
            <AuthorNetworkGraphPane
              root={authorNetworkData.data.root}
              linksData={authorNetworkData.data.link_data}
              views={views}
              onClickNode={(node) =>
                dispatch({ type: 'SET_SELECTED', payload: { node, dict: authorNetworkData.data.bibcode_dict } })
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
              description="Narrow down your search results to papers from a certain group or author"
              placeHolder="select an author or a group in the visualization and click the 'add to filter' button"
              direction={filterSearchDirection}
            />
            <AuthorNetworkDetailsPane
              summaryGraph={authorNetworkSummaryGraph}
              node={state.selected}
              onAddToFilter={(node) => dispatch({ type: 'ADD_FILTER', payload: node })}
              onRemoveFromFilter={(node) => dispatch({ type: 'REMOVE_FILTER', payload: node })}
              canAddAsFilter={state.filters.findIndex((f) => f.name === state.selected.name) === -1}
            />
          </Box>
        </SimpleGrid>
      )}
    </Box>
  );
};

const StatusDisplay = ({
  authorNetworkIsError,
  authorNetworkIsLoading,
  authorNetworkError,
}: {
  authorNetworkIsError: boolean;
  authorNetworkIsLoading: boolean;
  authorNetworkError: unknown;
}): ReactElement => {
  return (
    <>
      {authorNetworkIsError && (
        <StandardAlertMessage
          status="error"
          title="Error fetching author network data!"
          description={axios.isAxiosError(authorNetworkError) && authorNetworkError.message}
        />
      )}
      {authorNetworkIsLoading && (
        <Center>
          <LoadingMessage message="Fetching author network data" />
        </Center>
      )}
    </>
  );
};
