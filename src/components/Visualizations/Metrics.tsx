import { IADSApiMetricsResponse, IDocsEntity, MetricsResponseKey, useGetMetricsTimeSeries } from '@api';
import { Box, Heading } from '@chakra-ui/layout';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  CircularProgress,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react';
import { useIsClient } from '@hooks/useIsClient';
import { useMetrics } from '@hooks/useMetrics';
import { BarDatum } from '@nivo/bar';
import { Serie } from '@nivo/line';
import axios from 'axios';
import { ReactElement, useMemo } from 'react';
import { LineGraph, BarGraph, PapersTable, CitationsTable, ReadsTable, IndicesTable } from '@components';

import {
  ICitationsTableData,
  IIndicesTableData,
  IMetricsGraphs,
  IPapersTableData,
  IReadsTableData,
  ILineGraph,
} from './types';
import { getIndicesTableData, plotTimeSeriesGraph } from './utils';
export interface IMetricsProps {
  metrics: IADSApiMetricsResponse;
  isAbstract: boolean;
  bibcodes?: IDocsEntity['bibcode'][];
}

export const Metrics = (props: IMetricsProps): ReactElement => {
  const { metrics, isAbstract, bibcodes } = props;

  const {
    citationsTable,
    readsTable,
    papersTable,
    indicesTable,
    citationsGraphs,
    readsGraphs,
    papersGraphs,
    indicesGraph,
  } = useMetrics(metrics, isAbstract || bibcodes.length === 1);

  return (
    <>
      {isAbstract ? (
        <>
          <CitationsSection citationsTable={citationsTable} citationsGraphs={citationsGraphs} isAbstract={true} />
          <ReadsSection readsTable={readsTable} readsGraphs={readsGraphs} isAbstract={true} />
        </>
      ) : (
        <Tabs variant="solid-rounded" isFitted>
          <TabList>
            <Tab>Papers</Tab>
            <Tab>Citations</Tab>
            <Tab>Reads</Tab>
            <Tab>Indices</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <PapersSection papersTable={papersTable} papersGraph={papersGraphs} />
            </TabPanel>
            <TabPanel>
              <CitationsSection citationsTable={citationsTable} citationsGraphs={citationsGraphs} isAbstract={false} />
            </TabPanel>
            <TabPanel>
              <ReadsSection readsTable={readsTable} readsGraphs={readsGraphs} isAbstract={false} />
            </TabPanel>
            <TabPanel>
              <IndicesSection indicesTable={indicesTable} indicesGraph={indicesGraph} bibcodes={bibcodes} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </>
  );
};

const PapersSection = ({
  papersTable,
  papersGraph,
}: {
  papersTable: IPapersTableData;
  papersGraph: IMetricsGraphs;
}): ReactElement => {
  const isClient = useIsClient();

  return (
    <>
      {papersTable || papersGraph ? (
        <Box as="section" aria-labelledby="papers-heading" mt={10}>
          <Heading
            as="h3"
            fontSize="2xl"
            fontWeight="light"
            backgroundColor="gray.50"
            p={3}
            id="papers-heading"
            display="none"
          >
            Papers
          </Heading>
          {papersTable && <PapersTable data={papersTable} />}
          {isClient && papersGraph && <MetricsGraphs graphs={papersGraph} />}
        </Box>
      ) : (
        <Text>No data</Text>
      )}
    </>
  );
};

const CitationsSection = ({
  citationsTable,
  citationsGraphs,
  isAbstract,
}: {
  citationsTable: ICitationsTableData;
  citationsGraphs: IMetricsGraphs;
  isAbstract: boolean;
}): ReactElement => {
  const isClient = useIsClient();

  return (
    <>
      {citationsTable || citationsGraphs ? (
        <Box as="section" aria-labelledby="citations-heading" mt={10}>
          <Heading
            as="h3"
            fontSize="2xl"
            fontWeight="light"
            backgroundColor="gray.50"
            p={3}
            id="citations-heading"
            display={isAbstract ? 'block' : 'none'}
          >
            Citations
          </Heading>
          {citationsTable && <CitationsTable data={citationsTable} isAbstract={isAbstract} />}
          {isClient && citationsGraphs && <MetricsGraphs graphs={citationsGraphs} />}
        </Box>
      ) : (
        <>{!isAbstract && <Text>No data</Text>}</>
      )}
    </>
  );
};

const ReadsSection = ({
  readsTable,
  readsGraphs,
  isAbstract,
}: {
  readsTable: IReadsTableData;
  readsGraphs: IMetricsGraphs;
  isAbstract: boolean;
}): ReactElement => {
  const isClient = useIsClient();

  return (
    <>
      {readsTable || readsGraphs ? (
        <Box as="section" aria-labelledby="reads-heading" mt={10}>
          <Heading
            as="h3"
            fontSize="2xl"
            fontWeight="light"
            backgroundColor="gray.50"
            p={3}
            id="reads-heading"
            display={isAbstract ? 'block' : 'none'}
          >
            Reads
          </Heading>
          {readsTable && <ReadsTable data={readsTable} isAbstract={isAbstract} />}
          {isClient && readsGraphs && (
            <MetricsGraphs graphs={readsGraphs} showGroupOptions={!isAbstract} showLegend={!isAbstract} />
          )}
        </Box>
      ) : (
        <>{!isAbstract && <Text>No data</Text>}</>
      )}
    </>
  );
};

const getBarGraphYearTicks = (data: BarDatum[]) => {
  if (data.length <= 9) {
    return undefined;
  }
  const ticks: string[] = [];
  data.forEach((row) => {
    if (+row.year % 5 === 0) {
      ticks.push(row.year as string);
    }
  });
  return ticks;
};

const getLineGraphYearTicks = (data: Serie[]) => {
  if (data[0].data.length <= 9) {
    return undefined;
  }
  const ticks: string[] = [];

  data[0].data.forEach(({ x }) => {
    if (+x % 5 === 0) {
      ticks.push(x as string);
    }
  });

  return ticks;
};

const IndicesSection = ({
  indicesTable,
  indicesGraph,
  bibcodes,
}: {
  indicesTable: IIndicesTableData;
  indicesGraph: ILineGraph;
  bibcodes?: IDocsEntity['bibcode'][];
}): ReactElement => {
  // query to get indices metrics if there is no indices graph
  const {
    data: metricsData,
    isError: isErrorMetrics,
    error: errorMetrics,
    isLoading,
  } = useGetMetricsTimeSeries(bibcodes, {
    enabled: !!indicesTable && !indicesGraph && bibcodes && bibcodes.length > 0,
  });

  const computedGraph = useMemo(() => {
    return metricsData && metricsData[MetricsResponseKey.TS]
      ? plotTimeSeriesGraph(metricsData[MetricsResponseKey.TS])
      : undefined;
  }, [metricsData]);

  // This will be a more detailed table than the one passed in
  const computedTable = useMemo(() => {
    return metricsData && metricsData[MetricsResponseKey.IR]
      ? getIndicesTableData({
          refereed: metricsData[MetricsResponseKey.IR],
          total: metricsData[MetricsResponseKey.I],
        })
      : indicesTable;
  }, [metricsData]);

  return (
    <>
      {indicesTable ? (
        <Box as="section" aria-labelledby="indices-heading" mt={10}>
          <Heading
            as="h3"
            fontSize="2xl"
            fontWeight="light"
            backgroundColor="gray.50"
            p={3}
            id="indices-heading"
            display="none"
          >
            Indices
          </Heading>
          {indicesTable && <IndicesTable data={computedTable} />}
          {indicesGraph && <LineGraph data={indicesGraph.data} ticks={getLineGraphYearTicks(indicesGraph.data)} />}
          {!indicesGraph && isLoading && <CircularProgress mt={5} isIndeterminate />}
          {!indicesGraph && isErrorMetrics && (
            <Alert status="error" my={5}>
              <AlertIcon />
              <AlertTitle mr={2}>Error fetching indices graph data!</AlertTitle>
              <AlertDescription>{axios.isAxiosError(errorMetrics) && errorMetrics.message}</AlertDescription>
            </Alert>
          )}
          {computedGraph && <LineGraph data={computedGraph.data} ticks={getLineGraphYearTicks(computedGraph.data)} />}
        </Box>
      ) : (
        <Text>No data</Text>
      )}
    </>
  );
};

const MetricsGraphs = ({
  graphs,
  showLegend = true,
  showGroupOptions = true,
}: {
  graphs: IMetricsGraphs;
  showLegend?: boolean;
  showGroupOptions?: boolean;
}): ReactElement => {
  return (
    <Tabs mt={5} variant="soft-rounded" size="sm" align="center">
      <TabList>
        <Tab>Total</Tab>
        <Tab>Normalized</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <BarGraph
            data={graphs.totalGraph.data}
            indexBy={graphs.totalGraph.indexBy}
            keys={graphs.totalGraph.keys}
            ticks={getBarGraphYearTicks(graphs.totalGraph.data)}
            showLegend={showLegend}
            showGroupOptions={showGroupOptions}
          />
        </TabPanel>
        <TabPanel>
          <BarGraph
            data={graphs.normalizedGraph.data}
            indexBy={graphs.normalizedGraph.indexBy}
            keys={graphs.normalizedGraph.keys}
            ticks={getBarGraphYearTicks(graphs.normalizedGraph.data)}
            showLegend={showLegend}
            showGroupOptions={showGroupOptions}
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};
