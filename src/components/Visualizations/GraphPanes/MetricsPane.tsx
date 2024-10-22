import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  CircularProgress,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react';

import { useIsClient } from '@/lib/useIsClient';
import { useMetrics } from '@/lib/useMetrics';
import { BarDatum } from '@nivo/bar';
import axios from 'axios';
import { ReactElement, useMemo } from 'react';

import {
  IBarGraph,
  ICitationsTableData,
  IIndicesTableData,
  ILineGraph,
  IMetricsGraphs,
  IPapersTableData,
  IReadsTableData,
} from '../types';
import { getIndicesTableData, getLineGraphXTicks, plotTimeSeriesGraph } from '../utils';
import { DataDownloader } from '@/components/DataDownloader';
import {
  BarGraph,
  CitationsTable,
  IndicesTable,
  LineGraph,
  PapersTable,
  ReadsTable,
} from '@/components/Visualizations';
import { useColorModeColors } from '@/lib/useColorModeColors';
import { IADSApiMetricsResponse, MetricsResponseKey, TimeSeriesKey } from '@/api/metrics/types';
import { IDocsEntity } from '@/api/search/types';
import { useGetMetricsTimeSeries } from '@/api/metrics/metrics';

export interface IMetricsProps {
  metrics: IADSApiMetricsResponse;
  isAbstract: boolean;
  bibcodes?: IDocsEntity['bibcode'][];
}

export const MetricsPane = (props: IMetricsProps): ReactElement => {
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

  const colors = useColorModeColors();

  return (
    <>
      {papersTable || papersGraph ? (
        <Box as="section" aria-labelledby="papers-heading">
          <Heading
            as="h3"
            fontSize="2xl"
            fontWeight="light"
            backgroundColor={colors.panel}
            p={3}
            id="papers-heading"
            display="none"
          >
            Papers
          </Heading>
          {papersGraph && (
            <DataDownloader
              label="Download CSV Data"
              getFileContent={() => getBarGraphCSVDataContent(papersGraph.totalGraph)}
              fileName="metrics-papers.csv"
              my={5}
            />
          )}
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

  const colors = useColorModeColors();

  return (
    <>
      {citationsTable || citationsGraphs ? (
        <Box as="section" aria-labelledby="citations-heading">
          <Heading
            as="h3"
            fontSize="2xl"
            fontWeight="light"
            backgroundColor={colors.panel}
            p={3}
            id="citations-heading"
            display={isAbstract ? 'block' : 'none'}
          >
            Citations
          </Heading>
          {citationsGraphs && (
            <DataDownloader
              label="Download CSV Data"
              getFileContent={() => getBarGraphCSVDataContent(citationsGraphs.totalGraph)}
              fileName="metrics-citations.csv"
              my={5}
            />
          )}
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

  const colors = useColorModeColors();

  return (
    <>
      {readsTable || readsGraphs ? (
        <Box as="section" aria-labelledby="reads-heading">
          <Heading
            as="h3"
            fontSize="2xl"
            fontWeight="light"
            backgroundColor={colors.panel}
            p={3}
            id="reads-heading"
            display={isAbstract ? 'block' : 'none'}
          >
            Reads
          </Heading>
          {readsGraphs && (
            <DataDownloader
              label="Download CSV Data"
              getFileContent={() => getBarGraphCSVDataContent(readsGraphs.totalGraph)}
              fileName="metrics-reads.csv"
              my={5}
            />
          )}
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

const IndicesSection = ({
  indicesTable,
  indicesGraph,
  bibcodes,
}: {
  indicesTable: IIndicesTableData;
  indicesGraph: ILineGraph;
  bibcodes?: IDocsEntity['bibcode'][];
}): ReactElement => {
  const colors = useColorModeColors();

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

  const getCSVDataContent = () => {
    const data = metricsData[MetricsResponseKey.TS];
    const keys = Object.keys(data) as TimeSeriesKey[];
    const years = Object.keys(data[keys[0]]);

    // headers
    let output = 'Year';
    keys.forEach((key) => {
      output += `, ${key}`;
    });

    // rows
    years.forEach((year) => {
      output += `\n${year}`;
      keys.forEach((key) => {
        output += `,${data[key][year]}`;
      });
    });

    return output;
  };

  return (
    <>
      {indicesTable ? (
        <Box as="section" aria-labelledby="indices-heading">
          <Heading
            as="h3"
            fontSize="2xl"
            fontWeight="light"
            backgroundColor={colors.panel}
            p={3}
            id="indices-heading"
            display="none"
          >
            Indices
          </Heading>
          {metricsData && metricsData[MetricsResponseKey.TS] && (
            <DataDownloader
              label="Download CSV Data"
              getFileContent={() => getCSVDataContent()}
              fileName="metrics-indices.csv"
              my={5}
            />
          )}
          {indicesTable && <IndicesTable data={computedTable} />}
          {indicesGraph && (
            <LineGraph data={indicesGraph.data} ticks={getLineGraphXTicks(indicesGraph.data, 5)} xScaleType="linear" />
          )}
          {!indicesGraph && isLoading && <CircularProgress mt={5} isIndeterminate />}
          {!indicesGraph && isErrorMetrics && (
            <Alert status="error" my={5}>
              <AlertIcon />
              <AlertTitle mr={2}>Error fetching indices graph data!</AlertTitle>
              <AlertDescription>{axios.isAxiosError(errorMetrics) && errorMetrics.message}</AlertDescription>
            </Alert>
          )}
          {computedGraph && (
            <LineGraph
              data={computedGraph.data}
              ticks={getLineGraphXTicks(computedGraph.data, 5)}
              xScaleType="linear"
            />
          )}
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
    <Tabs mt={5} variant="solid-rounded" size="sm" align="center">
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

const getBarGraphCSVDataContent = (graphData: IBarGraph<BarDatum>, recordTotal = true) => {
  const data = graphData.data;
  const keys = graphData.keys;

  // headers
  let output = 'Year';
  keys.forEach((key) => {
    output += `, ${key}`;
  });
  output += recordTotal ? ', Total\n' : '\n';

  data.forEach((datum) => {
    output += `${datum.year}`; // year
    let total = 0;
    keys.forEach((key) => {
      output += `, ${datum[key]}`; // value
      total += datum[key] as number;
    });
    output += recordTotal ? `, ${total}\n` : '\n';
  });
  return output;
};
