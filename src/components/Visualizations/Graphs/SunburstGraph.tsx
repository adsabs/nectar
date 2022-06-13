import { Box } from '@chakra-ui/react';
import { ComputedDatum, ResponsiveSunburst } from '@nivo/sunburst';
import { ReactElement } from 'react';
import { ISunburstGraph, SunburstNode } from '../types';

export interface ISunburstGraphProps {
  graph: ISunburstGraph;
}

const getArcLabel = ({ data }: ComputedDatum<SunburstNode>) => (typeof data.name === 'string' ? `${data.name}` : '');

export const SunburstGraph = ({ graph }: ISunburstGraphProps): ReactElement => {
  return (
    <Box width="100%" mt={5}>
      <div style={{ height: '700px' }}>
        <ResponsiveSunburst
          data={graph.data}
          margin={{ top: 50, right: 10, bottom: 50, left: 10 }}
          id={graph.idKey}
          value={graph.valueKey}
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
