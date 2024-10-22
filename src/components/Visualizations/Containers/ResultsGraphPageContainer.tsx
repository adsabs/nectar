import { CheckCircleIcon } from '@chakra-ui/icons';
import { Box, Flex, List, ListIcon, ListItem, Text, useToast } from '@chakra-ui/react';

import { Expandable } from '@/components/Expandable';
import { setFQ } from '@/query-utils';
import axios from 'axios';
import { useRouter } from 'next/router';
import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { BubblePlotPane } from '../GraphPanes';
import { getResultsGraph } from '../utils';
import { CustomInfoMessage, LoadingMessage, StandardAlertMessage } from '@/components/Feedbacks';
import { IBubblePlotNodeData } from '@/components/Visualizations';
import { DataDownloader } from '@/components/DataDownloader';
import { makeSearchParams } from '@/utils/common/search';
import { IADSApiSearchParams, IDocsEntity } from '@/api/search/types';
import { useGetResultsGraph } from '@/api/vis/vis';
import { useVaultBigQuerySearch } from '@/api/vault/vault';

interface IResultsGraphPageContainerProps {
  query: IADSApiSearchParams;
}

export const ResultsGraphPageContainer = ({ query }: IResultsGraphPageContainerProps): ReactElement => {
  const router = useRouter();
  const toast = useToast();

  // fetch graph data
  const { data, isLoading, isSuccess, isError, error } = useGetResultsGraph(
    { ...query },
    { enabled: !!query && !!query.q && query.q.length > 0 },
  );

  // when filtered search is applied, trigger big query
  const [applyingBibcodes, setApplyingBibcodes] = useState<string[]>([]);
  const { data: bigQueryData, error: bigQueryError } = useVaultBigQuerySearch(applyingBibcodes, {
    enabled: applyingBibcodes.length > 0,
  });

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
  }, [bigQueryData, bigQueryError, applyingBibcodes]);

  const graphData = useMemo(() => {
    if (data?.response?.docs) {
      return getResultsGraph(data.response.docs);
    }
  }, [data]);

  // get all papers (bibcodes) of the selected nodes and trigger big query search
  const handleApplyFilter = (nodes: IBubblePlotNodeData[]) => {
    const bibcodes = nodes.map((n) => n.bibcode);

    // This will trigger big query and redirect
    setApplyingBibcodes(bibcodes);
  };

  const getCSVDataContent = useCallback(() => {
    type ResultDoc = Pick<IDocsEntity, 'bibcode' | 'pubdate' | 'title' | 'read_count' | 'citation_count'>;
    const keys: (keyof ResultDoc)[] = ['bibcode', 'pubdate', 'title', 'read_count', 'citation_count'];
    const docs = data.response.docs as ResultDoc[];
    let output = keys.join(',') + '\n';
    docs.forEach((doc) => {
      keys.forEach((key) => {
        output += key === 'title' ? `"${doc[key][0].replace(/"/g, "'")}",` : `"${doc[key]}",`;
      });
      output = output.slice(0, -1) + '\n';
    });

    return output;
  }, [data?.response?.docs]);

  return (
    <Box as="section" aria-label="Results Graph" my={10}>
      {isError && (
        <StandardAlertMessage
          status="error"
          title="Error fetching results graph data!"
          description={axios.isAxiosError(error) && error.message}
        />
      )}
      {isLoading && <LoadingMessage message="Fetching results graph data" />}
      {!isLoading && isSuccess && !graphData && (
        <CustomInfoMessage status="info" title="Could not generate" description="Could not generate results graph" />
      )}
      {!isLoading && isSuccess && graphData && (
        <Flex direction="column" gap={2}>
          <Expandable
            title="About Results Graph"
            description={
              <>
                This graph allows you to view metrics for both the long-term influence (citation count) and recent
                popularity (90 day read count) of the top 1500 papers from your search results.
                <Text fontWeight="bold" mt={2}>
                  Customize Graph
                </Text>
                <List w="100%">
                  <ListItem>
                    <ListIcon as={CheckCircleIcon} color="green.500" />
                    Click on a journal name at right to limit papers (click again to return to the unfiltered view)
                  </ListItem>
                  <ListItem>
                    <ListIcon as={CheckCircleIcon} color="green.500" />
                    Click on the y axis log/linear options
                  </ListItem>
                  <ListItem>
                    <Flex direction="row" alignItems="center">
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Click on the different views to swap y axis and bubble radius
                    </Flex>
                  </ListItem>
                  <ListItem>
                    <Flex direction="row" alignItems="center">
                      <ListIcon as={CheckCircleIcon} color="green.500" />
                      Click on paper nodes or draw rectangle boundary to select papers for tracking purposes throughout
                      the three graphs, or to apply filter.
                    </Flex>
                  </ListItem>
                </List>
                <Text fontWeight="bold" mt={2}>
                  Filter your search
                </Text>
                Select papers by dragging from left to right around bubbles to form a box, then click submit
              </>
            }
          />
          {data?.response?.docs && (
            <DataDownloader
              label="Download CSV Data"
              getFileContent={() => getCSVDataContent()}
              fileName="results-graph.csv"
            />
          )}
          <BubblePlotPane graph={graphData} onApplyFilter={handleApplyFilter} />
        </Flex>
      )}
    </Box>
  );
};
