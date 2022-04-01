import { Box, Heading } from '@chakra-ui/layout';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { useIsClient } from '@hooks/useIsClient';
import { useMetrics } from '@hooks/useMetrics';
import { BarDatum } from '@nivo/bar';
import { IADSApiMetricsResponse } from '@_api/metrics';
import { ReactElement } from 'react';
import { CitationsTable } from './CitationsTable';
import { MetricsGraph } from './MetricsGraph';
import { ReadsTable } from './ReadsTable';
import { IMetricsGraphs } from './types';
export interface IMetricsProps {
  metrics: IADSApiMetricsResponse;
  isAbstract: boolean;
}

export const Metrics = (props: IMetricsProps): ReactElement => {
  const { metrics, isAbstract } = props;

  const isClient = useIsClient();

  const { citationsTable, readsTable, citationsGraphs, readsGraphs } = useMetrics(metrics);

  return (
    <>
      {citationsTable || citationsGraphs ? (
        <Box as="section" aria-labelledby="citations-heading">
          <Heading as="h3" fontSize="2xl" fontWeight="light" backgroundColor="gray.50" p={3} id="citations-heading">
            Citations
          </Heading>
          {citationsTable && <CitationsTable data={citationsTable} isAbstract={isAbstract} />}
          {isClient && citationsGraphs && <MetricsGraphs graphs={citationsGraphs} />}
        </Box>
      ) : null}

      {readsTable || readsGraphs ? (
        <Box as="section" aria-labelledby="reads-heading">
          <Heading as="h3" fontSize="2xl" fontWeight="light" backgroundColor="gray.50" p={3} id="reads-heading">
            Reads
          </Heading>
          {readsTable && <ReadsTable data={readsTable} isAbstract={isAbstract} />}
          {isClient && readsGraphs && <MetricsGraphs graphs={readsGraphs} />}
        </Box>
      ) : null}
    </>
  );
};

const MetricsGraphs = ({ graphs }: { graphs: IMetricsGraphs }): ReactElement => {
  const getYearTicks = (data: BarDatum[]) => {
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
            ticks={getYearTicks(graphs.totalGraph.data)}
          />
        </TabPanel>
        <TabPanel>
          <MetricsGraph
            data={graphs.normalizedGraph.data}
            indexBy="year"
            keys={graphs.normalizedGraph.keys}
            ticks={getYearTicks(graphs.normalizedGraph.data)}
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};
