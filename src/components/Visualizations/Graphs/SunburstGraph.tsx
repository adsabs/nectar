import { Box } from '@chakra-ui/react';
import { ComputedDatum, ResponsiveSunburst } from '@nivo/sunburst';
import { ReactElement } from 'react';
import { ISunburstGraph, SunburstDatum } from '../types';

export interface ISunburstGraphProps {
  graph: ISunburstGraph;
}

const getArcLabel = ({ data }: ComputedDatum<SunburstDatum>) => `${data.label}`;

export const SunburstGraph = ({ graph }: ISunburstGraphProps): ReactElement => {
  return (
    <Box width="100%" mt={5}>
      <div style={{ height: '500px' }}>
        <ResponsiveSunburst
          data={graph.data}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          id="id"
          value="value"
          valueFormat=" >-,"
          borderWidth={0.5}
          colors={{ scheme: 'set3' }}
          childColor={{
            from: 'color',
            modifiers: [['darker', 0.6]],
          }}
          enableArcLabels={true}
          arcLabel={getArcLabel}
          arcLabelsRadiusOffset={1.55}
          arcLabelsTextColor={{
            from: 'color',
            modifiers: [['darker', 1.4]],
          }}
        />
      </div>
    </Box>
  );
};
