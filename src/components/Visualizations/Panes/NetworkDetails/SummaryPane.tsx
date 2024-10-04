import { Text } from '@chakra-ui/react';

import { getLineGraphXTicks } from '@/components/Visualizations/utils';
import { ILineGraph, LineGraph } from '@/components/Visualizations';
import { CustomInfoMessage } from '@/components/Feedbacks';

// Show Summary graph of network
export const SummaryPane = ({ summaryGraph }: { summaryGraph: ILineGraph }) => {
  const singleYear = !summaryGraph.error && summaryGraph.data.find((serie) => serie.data.length > 1) === undefined;

  return (
    <>
      {summaryGraph.error && (
        <CustomInfoMessage status={'error'} title="Cannot generate network" description={summaryGraph.error.message} />
      )}
      <>
        <Text>Group Activity Over Time (measured in papers published)</Text>
        <LineGraph
          data={summaryGraph.data}
          ticks={getLineGraphXTicks(summaryGraph.data, 5)}
          xScaleType={singleYear ? 'point' : 'linear'}
        />
      </>
    </>
  );
};
