import { CustomInfoMessage } from '@components/Feedbacks';
import { LineGraph } from '@components/Visualizations/Graphs';
import { ILineGraph } from '@components/Visualizations/types';
import { getLineGraphXTicks } from '@components/Visualizations/utils';
import { Text } from '@chakra-ui/react';

// Show Summary graph of network
export const SummaryPane = ({ summaryGraph }: { summaryGraph: ILineGraph }) => {
  const notEnoughData = !summaryGraph.error && summaryGraph.data.find((serie) => serie.data.length > 1) === undefined;

  return (
    <>
      {summaryGraph.error && (
        <CustomInfoMessage status={'error'} title="Cannot generate network" description={summaryGraph.error.message} />
      )}
      {!summaryGraph.error && notEnoughData ? (
        <CustomInfoMessage status={'info'} title="Not enough data to generate graph" />
      ) : (
        <>
          <Text>Group Activity Over Time (measured in papers published)</Text>
          <LineGraph data={summaryGraph.data} ticks={getLineGraphXTicks(summaryGraph.data, 5)} xScaleType="linear" />
        </>
      )}
    </>
  );
};
