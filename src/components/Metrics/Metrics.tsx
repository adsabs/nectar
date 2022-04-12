import { IDocsEntity } from '@api';
import { Box, Heading } from '@chakra-ui/layout';
import { useIsClient } from '@hooks/useIsClient';
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
} from '@chakra-ui/react';
import { useMetrics } from '@hooks/useMetrics';
import { BarDatum } from '@nivo/bar';
import { Serie } from '@nivo/line';
import { parseQueryFromUrlNoPage } from '@utils';
import { IADSApiMetricsResponse, MetricsResponseKey, useGetTimeSeries } from '@_api/metrics';
import axios from 'axios';
import { useRouter } from 'next/router';
import { ReactElement, useEffect, useMemo } from 'react';
import { CitationsTable } from './CitationsTable';
import { plotTimeSeriesGraph } from './graphUtils';
import { IndicesGraph } from './IndicesGraph';
import { IndicesTable } from './IndicesTable';
import { MetricsGraph } from './MetricsGraph';
import { PapersTable } from './PapersTable';
import { ReadsTable } from './ReadsTable';
import {
  ICitationsTableData,
  IIndicesTableData,
  IMetricsGraphs,
  IPapersTableData,
  IReadsTableData,
  LineGraph,
} from './types';
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
  } = useMetrics(metrics, isAbstract);

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
            <Tab isDisabled={!citationsTable && !citationsGraphs}>Citations</Tab>
            <Tab isDisabled={!readsTable && !readsGraphs}>Reads</Tab>
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
      ) : null}
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
      ) : null}
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
          {isClient && readsGraphs && <MetricsGraphs graphs={readsGraphs} />}
        </Box>
      ) : null}
    </>
  );
};

const getBarGraphYearTicks = (data: BarDatum[]) => {
  if (data.length <= 9) {
    return undefined;
  }
  const ticks: number[] = [];
  data.forEach((row) => {
    if ((row.year as number) % 5 === 0) {
      ticks.push(row.year as number);
    }
  });
  return ticks;
};

const getLineGraphYearTicks = (data: Serie[]) => {
  if (data[0].data.length <= 9) {
    return undefined;
  }
  const ticks: number[] = [];

  data[0].data.forEach(({ x }) => {
    if ((x as number) % 5 === 0) {
      ticks.push(x as number);
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
  indicesGraph: LineGraph;
  bibcodes?: IDocsEntity['bibcode'][];
}): ReactElement => {
  const router = useRouter();

  // query to get indices metrics if there is no indices graph
  const {
    data: metricsData,
    refetch: fetchMetrics,
    isError: isErrorMetrics,
    error: errorMetrics,
    isLoading,
  } = useGetTimeSeries({ id: parseQueryFromUrlNoPage(router.query), bibcodes }, { enabled: false });

  useEffect(() => {
    if (!indicesGraph && bibcodes && bibcodes.length > 0) {
      void fetchMetrics();
    }
  }, [bibcodes]);

  const computedGraph = useMemo(() => {
    return metricsData && metricsData[MetricsResponseKey.TS]
      ? plotTimeSeriesGraph(metricsData[MetricsResponseKey.TS])
      : undefined;
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
          {indicesTable && <IndicesTable data={indicesTable} />}
          {indicesGraph && <IndicesGraph data={indicesGraph.data} ticks={getLineGraphYearTicks(indicesGraph.data)} />}
          {!indicesGraph && isLoading && <CircularProgress mt={5} isIndeterminate />}
          {!indicesGraph && isErrorMetrics && (
            <Alert status="error" my={5}>
              <AlertIcon />
              <AlertTitle mr={2}>Error fetching indices graph data!</AlertTitle>
              <AlertDescription>{axios.isAxiosError(errorMetrics) && errorMetrics.message}</AlertDescription>
            </Alert>
          )}
          {computedGraph && (
            <IndicesGraph data={computedGraph.data} ticks={getLineGraphYearTicks(computedGraph.data)} />
          )}
        </Box>
      ) : null}
    </>
  );
};

const MetricsGraphs = ({ graphs }: { graphs: IMetricsGraphs }): ReactElement => {
  return (
    <Tabs mt={5} variant="soft-rounded" size="sm" align="center">
      <TabList>
        <Tab>Total</Tab>
        <Tab>Normalized</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <MetricsGraph
            data={graphs.totalGraph.data}
            indexBy="year"
            keys={graphs.totalGraph.keys}
            ticks={getBarGraphYearTicks(graphs.totalGraph.data)}
          />
        </TabPanel>
        <TabPanel>
          <MetricsGraph
            data={graphs.normalizedGraph.data}
            indexBy="year"
            keys={graphs.normalizedGraph.keys}
            ticks={getBarGraphYearTicks(graphs.normalizedGraph.data)}
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};
